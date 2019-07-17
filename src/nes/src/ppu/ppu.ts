/**
 * ppu.ts
 *
 * This PPU is heavily based on fogleman's NES PPU written in Go.
 */
import { PpuMemory } from "./ppumemory";
import { PpuPalette } from "./colors";
import { Cpu } from "../cpu";
import { InterruptRequestType } from "../cpu.interface";
import { UiFrameBuffer } from "../ui/framebuffer";
import { IMapper } from "../mapper";

/**
 * Constants
 */
const PPU_MAX_SPRITES_PER_SCANLINE = 8;

/**
 * The data structure to encapsulate the various sprite information
 * we will need to render.
 */
interface SpriteData {
  Data: number;
  PositionX: number;
  Priority: number;
  BaseOamAddress: number;
}

/**
 * JS gives us no native "pretty" way to handle 64 bit numbers.
 *
 * I have personally found that BigInt tends to be a bit too slow
 * a lot of the frequent shifts we would be required to do for background
 * pattern tiles.
 *
 * In order to get some sort of speed, we can slam 2 numbers together with
 * a "high" and "low" property to serve the same purpose.
 */
interface BackgroundData {
  DataHigh32: number;
  DataLow32: number;
}

export class Ppu {
  private _register: number;
  private _uiFrameBuffer: UiFrameBuffer;
  private _ppuMemory: PpuMemory;
  private _ppuDataReadBuffer: number;
  private _cycles: number;
  private _scanlines: number;
  private _frames: number;
  private _evenFrame: boolean;
  private _spriteCount: number;
  private _ntByte: number;
  private _attributeByte: number;
  private _tileLowByte: number;
  private _tileHighByte: number;

  // Declare internal PPU variables
  private _v: number;
  private _t: number;
  private _x: number; // Fine X scroll
  private _w: boolean; // first/second write toggle

  // Declare $2000/PPUCTRL bits
  private _regPPUCTRL_nt0: number;
  private _regPPUCTRL_nt1: number;
  private _regPPUCTRL_vramIncrement: number;
  private _regPPUCTRL_spritePatternTableBaseAddress: number;
  private _regPPUCTRL_backgroundPatternTableBaseAddress: number;
  private _regPPUCTRL_spriteSizeLarge: boolean;
  private _regPPUCTRL_masterSlaveSelect: boolean;
  private _regPPUCTRL_generateNmiAtVblankStart: boolean;

  // Declare $2001/PPUMASK bits
  private _regPPUMASK_greyscale: boolean;
  private _regPPUMASK_showBgInLeftMost8pxOfScreen: boolean;
  private _regPPUMASK_showSpritesLeftMost8pxOfScreen: boolean;
  private _regPPUMASK_showBackground: boolean;
  private _regPPUMASK_showSprites: boolean;
  private _regPPUMASK_emphasizeRed: boolean;
  private _regPPUMASK_emphasizeGreen: boolean;
  private _regPPUMASK_emphasizeBlue: boolean;

  // Declare $2002/PPUSTATUS bits
  private _regPPUSTATUS_spriteOverflow: boolean;
  private _regPPUSTATUS_spriteHit: boolean;
  // private _regPPUSTATUS_vblankStarted: boolean;
  private _nmiOccurred: boolean;

  private _cpu: Cpu;

  // Declare $2003/OAMADDR bits
  private _regOAMADDR_address: number;

  // Declare $2004/OAMDATA bits
  private _regOAMDATA_data: number;

  // Declare $2005/PPUSCROLL bits
  private _regPPUSCROLL_x: number;
  private _regPPUSCROLL_y: number;

  private _bgTile: BackgroundData;

  private _oam: number[];
  private _onScreenSprites: SpriteData[];

  private _nmiPrevious: boolean;
  private _nmiDelay: number;

  constructor(uiFrameBuffer: UiFrameBuffer, mapper: IMapper) {
    this._uiFrameBuffer = uiFrameBuffer;
    this._ppuMemory = new PpuMemory(mapper);

    this._register = 0;
    this._scanlines = 240;
    this._cycles = 340;
    this._frames = 0;
    this.write$2000(0);
    this.write$2001(0);
    this.write$2003(0);

    this._nmiOccurred = false;

    // Initialize background bytes.
    this._ntByte = 0;
    this._attributeByte = 0;
    this._tileLowByte = 0;
    this._tileHighByte = 0;

    this._v = 0;
    this._t = 0;
    this._w = false;

    this._spriteCount = 0;

    this._bgTile = {
      DataHigh32: 0,
      DataLow32: 0
    };

    this._initializeOam();
    this._initializeSprites();
  }

  get frames(): number {
    return this._frames;
  }

  get cycles(): number {
    return this._cycles;
  }

  get scanlines(): number {
    return this._scanlines;
  }

  set cpu(cpu: Cpu) {
    this._cpu = cpu;
  }

  public step(): void {
    this._tick();
    this._processTick();
  }

  public write(register: number, value: number) {
    this._register = value;
    if (register === 0x2000) {
      this.write$2000(value);
    } else if (register === 0x2001) {
      this.write$2001(value);
    } else if (register === 0x2003) {
      this.write$2003(value);
    } else if (register === 0x2004) {
      this.write$2004(value);
    } else if (register === 0x2005) {
      this.write$2005(value);
    } else if (register === 0x2006) {
      this.write$2006(value);
    } else if (register === 0x2007) {
      this.write$2007(value);
    } else if (register === 0x4014) {
      this.write$4014(value);
    }
  }

  public read(register: number) {
    if (register === 0x2002) {
      return this.read$2002();
    } else if (register === 0x2004) {
      return this.read$2004();
    } else if (register === 0x2007) {
      return this.read$2007();
    }

    return 0;
  }

  public write$2000(dataByte: number) {
    this._regPPUCTRL_nt0 = (dataByte & 0x01) > 0 ? 1 : 0;
    this._regPPUCTRL_nt1 = (dataByte & 0x02) > 0 ? 1 : 0;
    this._regPPUCTRL_vramIncrement = (dataByte & 0x04) === 0x0 ? 1 : 32;
    this._regPPUCTRL_spritePatternTableBaseAddress =
      (dataByte & 0x08) === 0x0 ? 0 : 0x1000;
    this._regPPUCTRL_backgroundPatternTableBaseAddress =
      (dataByte & 0x10) === 0x0 ? 0 : 0x1000;
    this._regPPUCTRL_spriteSizeLarge = (dataByte & 0x20) === 0x0 ? false : true;
    this._regPPUCTRL_masterSlaveSelect =
      (dataByte & 0x40) === 0x0 ? false : true;
    this._regPPUCTRL_generateNmiAtVblankStart =
      ((dataByte >> 7) & 1) === 1 ? true : false;

    this._nmiChange();

    this._t = (this._t & 0xf3ff) | (((dataByte & 0x03) << 10) & 0xffff);
  }

  public write$2001(dataByte: number) {
    this._regPPUMASK_greyscale = (dataByte & 1) === 1 ? true : false;
    this._regPPUMASK_showBgInLeftMost8pxOfScreen =
      ((dataByte >> 1) & 1) === 1 ? true : false;
    this._regPPUMASK_showSpritesLeftMost8pxOfScreen =
      ((dataByte >> 2) & 1) === 1 ? true : false;
    this._regPPUMASK_showBackground =
      ((dataByte >> 3) & 1) === 1 ? true : false;
    this._regPPUMASK_showSprites = ((dataByte >> 4) & 1) === 1 ? true : false;
    this._regPPUMASK_emphasizeRed = ((dataByte >> 5) & 1) === 1 ? true : false;
    this._regPPUMASK_emphasizeGreen =
      ((dataByte >> 6) & 1) === 1 ? true : false;
    this._regPPUMASK_emphasizeBlue = ((dataByte >> 7) & 1) === 1 ? true : false;
  }

  public read$2002() {
    var result = this._register & 0x1f;

    const bit_5 = this._regPPUSTATUS_spriteOverflow ? 1 : 0;
    const bit_6 = this._regPPUSTATUS_spriteHit ? 1 : 0;

    result |= bit_5 << 5;
    result |= bit_6 << 6;

    if (this._nmiOccurred) {
      result |= 1 << 7;
    }
    this._nmiOccurred = false;

    this._nmiChange();
    this._w = false;

    return result;
  }

  public write$2003(dataByte: number) {
    this._regOAMADDR_address = dataByte;
  }

  public read$2004() {
    return this._oam[this._regOAMADDR_address];
  }

  public write$2004(dataByte: number) {
    this._oam[this._regOAMADDR_address & 0xff] = dataByte;

    this._regOAMADDR_address++;
    this._regOAMADDR_address &= 0xff;
  }

  public write$2005(dataByte: number) {
    if (!this._w) {
      this._t = (this._t & 0xffe0) | (dataByte >>> 3);
      this._regPPUSCROLL_x = dataByte & 0x07;
      this._w = true;
    } else {
      this._t = (this._t & 0x8fff) | ((dataByte & 0x07) << 12);
      this._t = (this._t & 0xfc1f) | ((dataByte & 0xf8) << 2);
      this._w = false;
    }
  }

  public write$2006(dataByte: number) {
    if (!this._w) {
      this._t = (this._t & 0x80ff) | ((dataByte & 0x3f) << 8);
      this._w = true;
    } else {
      this._t = (this._t & 0xff00) | (dataByte & 0xffff);
      this._v = this._t;
      this._w = false;
    }
  }

  public write$2007(dataByte: number) {
    this._ppuMemory.set(this._v, dataByte);
    this.incrementVramAddress();
  }

  public read$2007() {
    let value = this._ppuMemory.get(this._v);
    if (this._v % 0x4000 < 0x3f00) {
      const bufferedData = this._ppuDataReadBuffer;
      this._ppuDataReadBuffer = value;
      value = bufferedData;
    } else {
      this._ppuDataReadBuffer = this._ppuMemory.get(this._v - 0x1000);
    }

    this.incrementVramAddress();

    return value;
  }

  public write$4014(dataByte: number) {
    let cpuAddress = (dataByte << 8) & 0xffff;
    for (let i = 0; i <= 0xff; i++) {
      this._oam[this._regOAMADDR_address] = this._cpu.memory.get(cpuAddress);
      this._regOAMADDR_address++;
      cpuAddress++;
    }

    // stall CPU for 514 cycles if odd, 513 is even.
    this._cpu.stallCycles += 513;
    if (this._cpu.currentCycles % 2 === 1) {
      this._cpu.stallCycles++;
    }
  }

  public incrementVramAddress() {
    this._v += this._regPPUCTRL_vramIncrement;
  }

  private _setVblank() {
    this._uiFrameBuffer.draw();
    this._nmiOccurred = true;
    this._nmiChange();
  }

  private _clearVblank() {
    this._nmiOccurred = false;
    this._nmiChange();
  }

  private _nmiChange() {
    const nmi = this._regPPUCTRL_generateNmiAtVblankStart && this._nmiOccurred;
    if (nmi && !this._nmiPrevious) {
      this._nmiDelay = 15;
    }

    this._nmiPrevious = nmi;
  }

  /**
   * Fetches a nametable byte based off of the current VRAM address, and
   * stores it for processing in further cycles.
   *
   * The nametable address is calculated by the following:
   *
   * The last 12 bits of the VRAM address will indicate the offset from the
   * nametable. We can then start at 0x2000 and bitwise-OR with the 12-bit VRAM
   * address.
   */
  private _fetchNametableByte(): void {
    const ntAddress = 0x2000 | (this._v & 0x0fff);
    this._ntByte = this._ppuMemory.get(ntAddress);
  }

  private _fetchAttributeByte(): void {
    const attributeAddress =
      0x23c0 |
      (this._v & 0x0c00) |
      ((this._v >>> 4) & 0x38) |
      ((this._v >>> 2) & 0x07);

    const shift = ((this._v >>> 4) & 4) | (this._v & 2);

    this._attributeByte =
      ((this._ppuMemory.get(attributeAddress) >>> shift) & 3) << 2;
  }

  private _fetchTileLowByte(): void {
    const fineY = (this._v >>> 12) & 7;
    const patternTableBaseAddress = this
      ._regPPUCTRL_backgroundPatternTableBaseAddress;
    const patternLowAddress =
      patternTableBaseAddress + (this._ntByte << 4) + fineY;
    this._tileLowByte = this._ppuMemory.get(patternLowAddress);
  }

  private _fetchTileHighByte(): void {
    const fineY = (this._v >>> 12) & 7;
    const patternTableBaseAddress = this
      ._regPPUCTRL_backgroundPatternTableBaseAddress;
    const patternHighAddress =
      patternTableBaseAddress + (this._ntByte << 4) + fineY + 8;

    this._tileHighByte = this._ppuMemory.get(patternHighAddress);
  }

  /**
   * After every 8 cycles for the PPU, the fetched Atrribute, Low Tile, and High Tile
   * bytes are stored and reloaded into the registers. The upper bits of the tile shift
   * registers are populated with this data. Meanwhile, the lower bits of the tile shift
   * registeres are being accessed for rendering during every cycle.
   */
  private _storeBackgroundTileData() {
    const attributeByte = this._attributeByte;

    let tileData: number = 0;
    for (let i = 0; i < 8; i++) {
      const lowBit = (this._tileLowByte & 0x80) >>> 7;
      const highBit = (this._tileHighByte & 0x80) >>> 6;

      this._tileLowByte <<= 1;
      this._tileHighByte <<= 1;

      tileData <<= 4;
      tileData |= attributeByte | highBit | lowBit;
    }

    this._bgTile.DataLow32 = tileData;
  }

  private _getBackgroundPixel(x: number, y: number) {
    let backgroundPixel = 0;

    if (!this._regPPUMASK_showBackground) {
      return backgroundPixel;
    }

    const pixel =
      (this._bgTile.DataHigh32 >>> ((7 - this._regPPUSCROLL_x) << 2)) & 0xf;

    return pixel;
  }

  /**
   * Shift a tile of 4 bits from the shift registers to form the background pixel
   * needed to render onto the screen.
   *
   * During this, we are processing the lower databytes from the shift registers.
   */
  private _renderPixel() {
    const x = this._cycles - 1;
    const y = this._scanlines;

    let usingBackgroundPixel = false;

    let backgroundPixel = this._getBackgroundPixel(x, y);
    var [spriteIndex, spritePixelColor] = this._getSpritePixel();

    if (x < 8 && !this._regPPUMASK_showBgInLeftMost8pxOfScreen) {
      backgroundPixel = 0;
    }
    if (x < 8 && !this._regPPUMASK_showSpritesLeftMost8pxOfScreen) {
      spritePixelColor = 0;
    }

    const b = backgroundPixel % 4 !== 0;
    const s = spritePixelColor % 4 !== 0;

    var color: number;
    if (!b && !s) {
      color = 0;
      usingBackgroundPixel = true;
    } else if (!b && s) {
      color = spritePixelColor | 0x10;
      usingBackgroundPixel = false;
    } else if (b && !s) {
      color = backgroundPixel;
      usingBackgroundPixel = true;
    } else {
      if (this._onScreenSprites[spriteIndex].BaseOamAddress === 0 && x < 255) {
        this._regPPUSTATUS_spriteHit = true;
      }
      if (this._onScreenSprites[spriteIndex].Priority === 0) {
        color = spritePixelColor | 0x10;
        usingBackgroundPixel = false;
      } else {
        color = backgroundPixel;
        usingBackgroundPixel = true;
      }
    }

    const attributeBits = color & 12;
    const basePaletteAddress = this._getBasePaletteAddress(
      attributeBits,
      usingBackgroundPixel
    );

    let paletteOffset = color & 3;
    var effectiveColorAddress = basePaletteAddress + paletteOffset;

    let colorByte = this._ppuMemory.get(effectiveColorAddress);

    this._uiFrameBuffer.drawPixel(x, y, PpuPalette[colorByte]);
  }

  private _getSpritePixel(): number[] {
    if (!this._regPPUMASK_showSprites) {
      return [0, 0];
    }

    for (let i = 0; i < this._spriteCount; i++) {
      let offset = this._cycles - 1 - this._onScreenSprites[i].PositionX;
      if (offset < 0 || offset > 7) {
        continue;
      }
      offset = 7 - offset;

      const color = (this._onScreenSprites[i].Data >>> (offset << 2)) & 0x0f;
      if (color % 4 === 0) {
        continue;
      }

      return [i, color];
    }

    return [0, 0];
  }

  private _incrementX(): void {
    if ((this._v & 0x001f) === 31) {
      this._v &= 0xffe0; // wrap-back to 0.
      this._v ^= 0x0400;
    } else {
      this._v++;
    }
  }

  private _incrementY(): void {
    if ((this._v & 0x7000) !== 0x7000) {
      this._v += 0x1000;
    } else {
      this._v = this._v & 0x8fff;

      let y = (this._v & 0x3e0) >>> 5;
      if (y === 29) {
        y = 0;

        this._v ^= 0x0800;
      } else if (y === 31) {
        y = 0;
      } else {
        y++;
      }

      this._v = (this._v & 0xfc1f) | (y << 5);
    }
  }

  private _copyX() {
    this._v = (this._v & 0xfbe0) | (this._t & 0x041f);
  }

  private _copyY() {
    this._v = (this._v & 0x841f) | (this._t & 0x7be0);
  }

  private _fetchSpritePattern(baseOamAddress: number, row: number): number {
    const oamIndex = baseOamAddress << 2;
    let tileByte = this._oam[oamIndex + 1];
    const attributes = this._oam[oamIndex + 2];

    let address = 0;
    if (!this._regPPUCTRL_spriteSizeLarge) {
      if ((attributes & 0x80) === 0x80) {
        row = 7 - row;
      }
      const baseTableMultiplier = this
        ._regPPUCTRL_spritePatternTableBaseAddress;
      address = baseTableMultiplier * 0x1000 + (tileByte << 4) + row;
    } else {
      if ((attributes & 0x80) === 0x80) {
        row = 15 - row;
      }

      const baseTableMultiplier = tileByte & 1;
      tileByte &= 0xfe;

      if (row > 7) {
        tileByte++;
        row -= 8;
      }
      address = baseTableMultiplier * 0x1000 + (tileByte << 4) + row;
    }

    let lowTileByte = this._ppuMemory.get(address);
    let highTileByte = this._ppuMemory.get(address + 8);

    let data = 0;

    const attributePalette = (attributes & 3) << 2;
    for (let i = 0; i < 8; i++) {
      var p1: number;
      var p2: number;
      if ((attributes & 0x40) === 0x40) {
        p1 = lowTileByte & 1;
        p2 = (highTileByte & 1) << 1;

        lowTileByte >>>= 1;
        highTileByte >>>= 1;
      } else {
        p1 = (lowTileByte & 0x80) >>> 7;
        p2 = (highTileByte & 0x80) >>> 6;

        lowTileByte <<= 1;
        highTileByte <<= 1;
      }

      data <<= 4;
      data |= attributePalette | p2 | p1;
    }

    return data;
  }

  private _evaluateSprites() {
    const height = this._regPPUCTRL_spriteSizeLarge ? 16 : 8;
    let spriteCount = 0;

    for (let i = 0; i < 64; i++) {
      const oamBaseIndex = i << 2;
      const y = this._oam[oamBaseIndex];
      const attribute = this._oam[oamBaseIndex + 2];
      const x = this._oam[oamBaseIndex + 3];

      const row = this._scanlines - y;
      if (row < 0 || row >= height) {
        continue;
      }

      if (spriteCount < 8) {
        this._onScreenSprites[spriteCount] = {
          Data: this._fetchSpritePattern(i, row),
          BaseOamAddress: i,
          PositionX: x,
          Priority: (attribute >>> 5) & 1
        };
      }

      spriteCount++;
    }

    if (spriteCount > PPU_MAX_SPRITES_PER_SCANLINE) {
      spriteCount = PPU_MAX_SPRITES_PER_SCANLINE;
      this._regPPUSTATUS_spriteOverflow = true;
    }

    this._spriteCount = spriteCount;
  }

  /**
   * Given the attribute bits AB00, determine the base palette address
   * from the background, or sprite.
   *
   * 0000=0, 0100=4, 1000=8, 1100=12
   *
   * @param attributeBits attribute bits
   * @param isBackgroundPixel is this a background pixel?
   */
  private _getBasePaletteAddress(
    attributeBits: number,
    isBackgroundPixel: boolean
  ) {
    const spriteOffset = isBackgroundPixel ? 0 : 0x10;

    let basePaletteAddress = 0x3f00;
    switch (attributeBits) {
      case 0:
        basePaletteAddress = 0x3f00;
        break;
      case 4:
        basePaletteAddress = 0x3f04;
        break;
      case 8:
        basePaletteAddress = 0x3f08;
        break;
      case 12:
        basePaletteAddress = 0x3f0c;
        break;
    }

    return basePaletteAddress + spriteOffset;
  }

  private _tick(): void {
    if (this._nmiDelay > 0) {
      this._nmiDelay--;
      if (
        this._nmiDelay === 0 &&
        this._regPPUCTRL_generateNmiAtVblankStart &&
        this._nmiOccurred
      ) {
        this._cpu.requestInterrupt(InterruptRequestType.NMI);
      }
    }

    if (this._regPPUMASK_showBackground || this._regPPUMASK_showSprites) {
      if (this._evenFrame && this._scanlines === 261 && this._cycles === 339) {
        this._cycles = 0;
        this._scanlines = 0;
        this._stepFrame();
        return;
      }
    }

    this._cycles++;
    if (this._cycles > 340) {
      this._scanlines++;
      this._cycles = 0;

      if (this._scanlines > 261) {
        this._scanlines = 0;
        this._stepFrame();
      }
    }
  }

  private _stepFrame() {
    this._frames++;
    this._evenFrame != this._evenFrame;
  }

  private _shiftBackgroundTile4(): void {
    this._bgTile.DataHigh32 <<= 4;
    this._bgTile.DataHigh32 =
      this._bgTile.DataHigh32 | ((this._bgTile.DataLow32 >>> 28) & 0xf);
    this._bgTile.DataLow32 <<= 4;
  }

  private _processTick(): void {
    const isRenderingEnabled =
      this._regPPUMASK_showBackground || this._regPPUMASK_showSprites;
    const isPrerenderLine = this._scanlines === 261;
    const isVisibleLine = this._scanlines < 240;
    const isRenderLine = isPrerenderLine || isVisibleLine;
    const isPrefetchCycle = this._cycles >= 321 && this._cycles <= 336;
    const isVisibleCycle = this._cycles >= 1 && this._cycles <= 256;
    const isFetchCycle = isPrefetchCycle || isVisibleCycle;

    if (isRenderingEnabled) {
      if (isVisibleLine && isVisibleCycle) {
        this._renderPixel();
      }
      if (isRenderLine && isFetchCycle) {
        this._shiftBackgroundTile4();

        switch (this._cycles % 8) {
          case 1:
            this._fetchNametableByte();
            break;
          case 3:
            this._fetchAttributeByte();
            break;
          case 5:
            this._fetchTileLowByte();
            break;
          case 7:
            this._fetchTileHighByte();
            break;
          case 0:
            this._storeBackgroundTileData();
            break;
        }
      }
      if (isPrerenderLine && this._cycles >= 280 && this._cycles <= 304) {
        this._copyY();
      }
      if (isRenderLine) {
        if (isFetchCycle && this._cycles % 8 === 0) {
          this._incrementX();
        }
        if (this._cycles === 256) {
          this._incrementY();
        }
        if (this._cycles === 257) {
          this._copyX();
        }
      }
    }

    if (isRenderingEnabled) {
      if (this._cycles === 257) {
        if (isVisibleLine) {
          this._evaluateSprites();
        } else {
          this._spriteCount = 0;
        }
      }
    }

    if (this._scanlines === 241 && this._cycles === 1) {
      this._setVblank();
    }
    if (isPrerenderLine && this._cycles === 1) {
      this._clearVblank();
      this._regPPUSTATUS_spriteHit = false;
      this._regPPUSTATUS_spriteOverflow = false;
    }
  }

  private _initializeOam() {
    this._oam = [];
    for (let i = 0; i <= 0xff; i++) {
      this._oam[i] = 0x0;
    }
  }

  private _initializeSprites() {
    this._onScreenSprites = [];
    for (let i = 0; i < 8; i++) {
      this._onScreenSprites.push({
        BaseOamAddress: 0,
        PositionX: 0,
        Data: 0,
        Priority: 0
      });
    }
  }
}
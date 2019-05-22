import { PpuMemory } from "../memory/ppumemory";
import { OamMemory } from "../memory/oammemory";
import { ColorComponent } from "../nes/common/interface";
import { getBaseNametableAddress } from "./ppu.helpers";
import { FrameBuffer, NesPpuPalette } from "../framebuffer/framebuffer";
import { byteValue2HexString } from "../utils/ui/utils";

class PixelBitsQueue {
  private static _MAX_LENGTH = 64;
  private _data: number[];

  constructor() {
    this._data = [];
    for(let i = 0; i < PixelBitsQueue._MAX_LENGTH; i++) {
      this._data[i] = 0;
    }
  }

  public push = (bit: number): void => {
    if(this._data.length === PixelBitsQueue._MAX_LENGTH) {
      this._data = this._data.slice(1, 64).concat([bit]);
    } else {
      this._data.push(bit);
    }
  }

  public shift4bits = (): void => {
    this._data = this._data.slice(4);
  }

  public get4bits = (): number[] => {
    return this._data.slice(0, 4);
  }
}

export class Ppu {
  private _frameBuffer: FrameBuffer;

  private _cpuNmiRequested: boolean;
  private _ppuMemory: PpuMemory;

  private _ppuDataReadBuffer: number;

  private _cycles: number;
  private _scanlines: number;
  private _frames: number;
  private _evenFrame: boolean;

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
  private _regPPUSTATUS_vblankStarted: boolean;

  // Declare $2003/OAMADDR bits
  private _regOAMADDR_address: number;

  // Declare $2004/OAMDATA bits
  private _regOAMDATA_data: number;

  // Declare $2005/PPUSCROLL bits
  private _regPPUSCROLL_x: number;
  private _regPPUSCROLL_y: number;

  private _pixelBits: PixelBitsQueue;

  private _oam: number[];

  constructor(ppuMemory: PpuMemory) {
    this._frameBuffer = new FrameBuffer();

    this._cpuNmiRequested = false;
    this._ppuMemory = ppuMemory;

    this._scanlines = 0;
    this._cycles = 0;

    this._tileLowByte = 0;
    this._tileHighByte = 0;

    this._v = 0;
    this._t = 0;
    this._w = false;

    this._pixelBits = new PixelBitsQueue();

    this._oam = [];
    for(let i = 0; i <= 0xFF; i++) {
      this._oam[i] = 0x0;
    }
  }

  public vramAddress() {
    return this._v;
  }

  public tVramAddress() {
    return this._t;
  }

  public fineX() {
    return this._x;
  }

  public vramAddressWriteToggle() {
    return this._w;
  }

  /**
   * Gets the framebuffer
   */
  public frameBuffer(): ColorComponent[][] {
    return this._frameBuffer.buffer;
  }

  public getCycles(): number {
    return this._cycles;
  }

  public getScanlines() {
    return this._scanlines;
  }

  public write$2000(dataByte: number) {
    this._regPPUCTRL_nt0 = dataByte & 0x01;
    this._regPPUCTRL_nt1 = dataByte & 0x02;
    this._regPPUCTRL_vramIncrement = (dataByte & 0x04) === 0x0 ? 1 : 32;
    this._regPPUCTRL_spritePatternTableBaseAddress =
      (dataByte & 0x08) === 0x0 ? 0x0 : 0x1000;
    this._regPPUCTRL_backgroundPatternTableBaseAddress =
      (dataByte & 0x10) === 0x0 ? 0x0000 : 0x1000;
    this._regPPUCTRL_spriteSizeLarge = (dataByte & 0x20) === 0x0 ? false : true;
    this._regPPUCTRL_masterSlaveSelect =
      (dataByte & 0x40) === 0x0 ? false : true;
    this._regPPUCTRL_generateNmiAtVblankStart =
      (dataByte & 0x80) === 0x0 ? false : true;

    if (this._regPPUCTRL_generateNmiAtVblankStart && this._isVblank()) {
      this._cpuNmiRequested = true;
    }
  }

  public read$2000() {
    const bit_0 = this._regPPUCTRL_nt0;
    const bit_1 = this._regPPUCTRL_nt1;
    const bit_2 = this._regPPUCTRL_vramIncrement === 1 ? 0 : 1;
    const bit_3 = this._regPPUCTRL_spritePatternTableBaseAddress === 0 ? 0 : 1;
    const bit_4 =
      this._regPPUCTRL_backgroundPatternTableBaseAddress === 0 ? 0 : 1;
    const bit_5 = this._regPPUCTRL_spriteSizeLarge ? 1 : 0;
    const bit_6 = this._regPPUCTRL_masterSlaveSelect ? 1 : 0;
    const bit_7 = this._regPPUCTRL_generateNmiAtVblankStart ? 1 : 0;
    return (
      (bit_7 << 7) |
      (bit_6 << 6) |
      (bit_5 << 5) |
      (bit_4 << 4) |
      (bit_3 << 3) |
      (bit_2 << 2) |
      (bit_1 << 1) |
      bit_0
    );
  }

  public write$2001(dataByte: number) {
    this._regPPUMASK_greyscale = (dataByte & 0x01) === 0x01 ? true : false;
    this._regPPUMASK_showBgInLeftMost8pxOfScreen =
      (dataByte & 0x02) === 0x02 ? true : false;
    this._regPPUMASK_showSpritesLeftMost8pxOfScreen =
      (dataByte & 0x04) === 0x04 ? true : false;
    this._regPPUMASK_showBackground = (dataByte & 0x08) === 0x08 ? true : false;
    this._regPPUMASK_showSprites = (dataByte & 0x10) === 0x10 ? true : false;
    this._regPPUMASK_emphasizeRed = (dataByte & 0x20) === 0x20 ? true : false;
    this._regPPUMASK_emphasizeGreen = (dataByte & 0x40) === 0x40 ? true : false;
    this._regPPUMASK_emphasizeBlue = (dataByte & 0x80) === 0x80 ? true : false;
  }

  public read$2002() {
    const bit_5 = this._regPPUSTATUS_spriteOverflow ? 1 : 0;
    const bit_6 = this._regPPUSTATUS_spriteHit ? 1 : 0;
    const bit_7 = this._regPPUSTATUS_vblankStarted ? 1 : 0;

    this._regPPUSTATUS_vblankStarted = false;
    this._w = false;

    return (bit_7 << 7) | (bit_6 << 6) | (bit_5 << 5);
  }

  public write$2002(dataByte: number) {
    this._regPPUSTATUS_spriteOverflow =
      (dataByte & 0x20) === 0x20 ? true : false;
    this._regPPUSTATUS_spriteHit = (dataByte & 0x40) === 0x40 ? true : false;
    this._regPPUSTATUS_vblankStarted =
      (dataByte & 0x80) === 0x80 ? true : false;
  }

  public write$2003(dataByte: number) {
    this._regOAMADDR_address = dataByte;
  }

  public read$2004() {
    return this._oam[this._regOAMADDR_address];
  }

  public write$2004(dataByte: number) {
    this._oam[this._regOAMADDR_address & 0xFF] = dataByte;

    this._regOAMADDR_address++;
    this._regOAMADDR_address &= 0xFF;
  }

  public write$2005(dataByte: number) {
    if (!this._w) {
      this._t = (this._t & 0xfffe0) | (dataByte >> 3);
      this._regPPUSCROLL_x = dataByte & 0x07;
      this._w = true;
    } else {
      this._t = (this._t & 0x8fff) | ((dataByte & 0x07) << 12);
      this._t = (this._t & 0xfc1f) | ((dataByte & 0xf8) << 2);
      this._w = false;
    }
  }

  public write$2006(dataByte: number) {
    /*
    if (!this._w) {
      this._t = (this._t & 0x80ff) | ((dataByte & 0x3f) << 8);
      this._w = true;
    } else {
      this._t = (this._t & 0xff00) | dataByte;
      this._v = this._t;
      this._w = false;
    }*/
    
    
    if (!this._w) {
      this._t = dataByte;
      this._w = true;
    } else {
      this._v = ((this._t << 8) | dataByte) & 0x3fff;
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

    /*
    const result = this._ppuDataReadBuffer;
    this._ppuDataReadBuffer = this._ppuMemory.get(this._v);

    this.incrementVramAddress();

    return result;
    */
  }

  public incrementVramAddress() {
    this._v += this._regPPUCTRL_vramIncrement;
  }

  public cpuNmiRequested(): boolean {
    if (this._cpuNmiRequested) {
      this._cpuNmiRequested = false;
      return true;
    }

    return false;
  }

  private _setVblank() {
    this._regPPUSTATUS_vblankStarted = true;
  }

  private _clearVblank() {
    this._regPPUSTATUS_vblankStarted = false;
  }

  private _isVblank(): boolean {
    return this._regPPUSTATUS_vblankStarted;
  }

  /**
   * An NMI can be PREVENTED if bit 7 of $2002 is off.
   *
   * Therefore, we only generate an NMI request to the CPU
   * IFF bit 7 of $2002 is ON.
   */
  private _requestNmiIfNeeded(): void {
    this._cpuNmiRequested = this._regPPUCTRL_generateNmiAtVblankStart;
  }

  private _fetchNametableByte(): void {
    const currentVramAddress = this._v;
    /*const ntAddress =
      getBaseNametableAddress(this.read$2000()) | (currentVramAddress & 0x0fff);*/
    const ntAddress = 0x2000 | ((this._v) & 0x0fff);
    this._ntByte = this._ppuMemory.get(ntAddress);
  }

  private _fetchAttributeByte(): void {
    const attributeAddress =
      0x23c0 |
      (this._v & 0x0c00) |
      ((this._v >> 4) & 0x38) |
      ((this._v >> 2) & 0x07);

    const shift = ((this._v >> 4) & 4) | (this._v & 2);

    this._attributeByte =
      ((this._ppuMemory.get(attributeAddress) >> shift) & 3) << 2;
  }

  private _fetchTileLowByte(): void {
    const fineY = (this._v >> 12) & 7;
    const patternTableBaseAddress = this
      ._regPPUCTRL_backgroundPatternTableBaseAddress;
    const patternLowAddress =
      patternTableBaseAddress + (0x10 * this._ntByte) + fineY;
    this._tileLowByte = this._ppuMemory.get(patternLowAddress);
  }

  private _fetchTileHighByte(): void {
    const fineY = (this._v >> 12) & 7;
    const patternTableBaseAddress = this
      ._regPPUCTRL_backgroundPatternTableBaseAddress;
    const patternHighAddress =
    patternTableBaseAddress + (0x10 * this._ntByte) + fineY + 8;

    this._tileHighByte = this._ppuMemory.get(patternHighAddress);
  }

  /**
   * After every 8 cycles for the PPU, the fetched Atrribute, Low Tile, and High Tile
   * bytes are stored and reloaded into the registers. The upper bits of the tile shift
   * registers are populated with this data. Meanwhile, the lower bits of the tile shift
   * registeres are being accessed for rendering during every cycle.
   */
  private _storeTileData() {
    for (let i = 0; i < 8; i++) {
      const attributeByte = this._attributeByte;

      const lowBit = (this._tileLowByte & 0x80) >> 7;
      const highBit = (this._tileHighByte & 0x80) >> 7;

      this._tileLowByte <<= 1;
      this._tileHighByte <<= 1;

      this._pixelBits.push(attributeByte >> 3);
      this._pixelBits.push(attributeByte >> 2);
      this._pixelBits.push(highBit);
      this._pixelBits.push(lowBit);
    }
  }

  /**
   * Shift a title of 4 bits from the shift registers to form the background pixel needed
   * to render onto the screen. During this, we are processing the lower databytes from the
   * shift registers.
   */
  private _renderPixel() {
    const x = this._cycles - 1;
    const y = this._scanlines;

    if(x < 8 && !this._regPPUMASK_showBgInLeftMost8pxOfScreen) {
      this._frameBuffer.draw(y, x, NesPpuPalette[byteValue2HexString(0x3f00)]);
      return;
    }

    const bits = this._pixelBits.get4bits();
    const attributeBits = (bits[0] << 1) | bits[1];
    const highBit = bits[2];
    const lowBit = bits[3];

    let paletteOffset = (highBit << 1) | lowBit;

    let basePaletteAddress = 0x3f00;
    switch (attributeBits) {
      case 0x0:
        basePaletteAddress = 0x3f01;
        break;
      case 0x1:
        basePaletteAddress = 0x3f05;
        break;
      case 0x2:
        basePaletteAddress = 0x3f09;
        break;
      case 0x3:
        basePaletteAddress = 0x3f0d;
        break;
    }

    let colorByte = this._ppuMemory.get(
      basePaletteAddress + (paletteOffset - 1)
    );

    this._frameBuffer.draw(y, x, NesPpuPalette[byteValue2HexString(colorByte)]);
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

      let y = (this._v & 0x3e0) >> 5;
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

  private _tick(): void {
    if (this._regPPUMASK_showBackground) {
      if (!this._evenFrame && this._scanlines === 261 && this._cycles === 339) {
        this._cycles = 0;
        this._scanlines = 0;
        this._frames++;
        if (this._frames % 2) {
          this._evenFrame = true;
        } else {
          this._evenFrame = false;
        }
        return;
      }
    }

    this._cycles++;
    if (this._cycles > 340) {
      this._scanlines++;
      this._cycles = 0;

      if (this._scanlines > 261) {
        this._scanlines = 0;
        this._frames++;
        if (this._frames % 2) {
          this._evenFrame = true;
        } else {
          this._evenFrame = false;
        }
      }
    }
  }

  public run(): void {
    this._tick();

    const isRenderingEnabled = this._regPPUMASK_showBackground;
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
        this._pixelBits.shift4bits();
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
            this._storeTileData();
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
    if (this._scanlines === 241 && this._cycles === 1) {
      this._setVblank();
      this._requestNmiIfNeeded();
    }
    if (isPrerenderLine && this._cycles === 1) {
      this._clearVblank();
    }
  }
}

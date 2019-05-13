import { PpuMemory } from "../memory/ppumemory";
import { OamMemory } from "../memory/oammemory";
import { ColorComponent } from "../nes/common/interface";
import {
  getBaseNametableAddress,
  getBasePaletteAddress,
  getAttributeGroupIndex
} from "./ppu.helpers";
import { PpuRegister } from "./ppu.interface";
import { FrameBuffer, NesPpuPalette } from "../framebuffer/framebuffer";
import { byteValue2HexString } from "../utils/ui/utils";

// PPUSTATUS (0x2002)
export enum PpuStatusBits {
  SpriteOverflow = 5,
  SpriteZeroHit = 6,
  Vblank = 7
}

export class Ppu {
  private _frameBuffer: FrameBuffer;

  private _cpuNmiRequested: boolean;
  private _ppuMemory: PpuMemory;
  private _oamMemory: OamMemory;

  private _ppuDataReadBuffer: number;
  // private _tVramAddress: number;
  // private _vramAddress: number;
  // private _isSecondWrite: boolean;

  private _cycles: number;
  private _totalCycles: number;
  private _scanlines: number;

  private _regPPUSTATUS: number;

  private _fineY: number;
  private _coarseX: number;
  private _coarseY: number;
  private _ntByte: number;
  private _attributeByte: number;
  private _tileLowByte: number;
  private _tileHighByte: number;
  private _tileData: number;

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

  // Declare $2005/PPUSCROLL bits
  private _regPPUSCROLL_x: number;
  private _regPPUSCROLL_y: number;

  constructor(ppuMemory: PpuMemory) {
    this._frameBuffer = new FrameBuffer();

    this._cpuNmiRequested = false;
    this._ppuMemory = ppuMemory;
    this._oamMemory = new OamMemory();

    this._totalCycles = 0;
    this._scanlines = 0;
    this._cycles = 0;

    this._regPPUSTATUS = 0;

    this._fineY = 0;
    this._coarseX = 0;
    this._coarseY = 0;

    this._tileLowByte = 0;
    this._tileHighByte = 0;
    this._tileData = 0;

    this._v = 0;
    this._t = 0;
    this._w = false;
  }

  public vramAddress() {
    return this._v;
  }

  /**
   * Gets the framebuffer
   */
  public frameBuffer(): ColorComponent[][] {
    return this._frameBuffer.buffer;
  }

  public addPpuCyclesInRun() {
    this.addPpuCycle();
  }

  public addPpuCycle() {
    this._cycles++;

    if (this._cycles > 340) {
      this._scanlines++;
      this._cycles = 0;

      if (this._scanlines > 261) {
        this._scanlines = 0;
      }
    }
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
      (dataByte & 0x10) === 0x0 ? 0x0 : 0x1000;
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

  public write$2002(dataByte: number) {
    this._regPPUSTATUS = dataByte & 0xff;
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

  public read$2002() {
    const currentStatus = this._regPPUSTATUS;

    this._clearVblank();
    this._w = false;

    return currentStatus;
  }

  public read$2007() {
    const result = this._ppuDataReadBuffer;
    this._ppuDataReadBuffer = this._ppuMemory.get(this._v);

    this.incrementVramAddress();

    return result;
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
    this._regPPUSTATUS = this._regPPUSTATUS | (0x1 << PpuStatusBits.Vblank);
  }

  private _clearVblank() {
    this._regPPUSTATUS = this._regPPUSTATUS & ~(0x1 << PpuStatusBits.Vblank);
  }

  private _isVblank(): boolean {
    return (this._regPPUSTATUS & (0x1 << PpuStatusBits.Vblank)) > 0x0;
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

  private _getPaletteAddress(
    basePaletteAddress: number,
    colorIndex: number
  ): number {
    return basePaletteAddress + (colorIndex - 1);
  }

  private _getHorizontalTileDelta(nameTableAddress: number) {
    return (nameTableAddress & 0x3e) >> 5 % 2;
  }

  private _getVerticalTileDelta(nameTableAddress: number) {
    return nameTableAddress & 0x1f;
  }

  /**
   * Converts an address from the name table to an attribute table address.
   * @param ntAddress Attribute table address
   */
  private _convertNametableAddressToAttributeTableAddress(
    ntAddress: number
  ): number {
    // Nametable address: 0010 NNYY YYYX XXXX
    // Attribute Table Address: 0010 NN11 11YY YXXX

    const yBits = ntAddress & 0x03e0; // 0000 0011 1110 0000
    const xBits = ntAddress & 0x001f; // 0000 0000 0001 1111
    const ntBits = ntAddress & 0x0c00; // 0000 1100 0000 0000
    const base = 0x2000; // 0010 0000 0000 0000
    const mask = 0x03c0; // 0000 0011 1100 0000

    const topYBits = (yBits & 0x0380) >> 4; // 0000 0011 1000 0000 -> 0000 0000 0011 1000
    const topXBits = (xBits & 0x001c) >> 2; // 0000 0000 0001 1100 -> 0000 0000 0000 0111

    // Ex 0x2209
    //   0010 0000 0000 0000 (0x2000)
    // | 0000 0000 0000 0000 (NT BITS)
    // | 0000 0011 1100 0000 (MASK => 0x03C0)
    // | 0000 0000 0010 0000 (TOP Y)
    // | 0000 0000 0000 0010 (TOP X)
    // ------------------------
    // > 0010 0011 1110 0010 => 0x23E2

    const address = base | ntBits | mask | topYBits | topXBits;

    return address;
  }

  private _fetchNametableByte(): void {
    const currentVramAddress = this._v;
    const ntAddress =
      getBaseNametableAddress(this.read$2000()) | (currentVramAddress & 0x0fff);
    this._ntByte = this._ppuMemory.get(ntAddress);
  }

  private _fetchAttributeByte(): void {
    const currentVramAddress = this._v;

    /*
    const ntAddress =
      getBaseNametableAddress(this.read$2000()) | (currentVramAddress & 0x0fff);
    const attributeAddress = this._convertNametableAddressToAttributeTableAddress(
      ntAddress
    );*/

    const attributeAddress = 0x23C0 | (this._v | 0x0C00) | ((this._v >> 4) & 0x38) | ((this._v >> 2) & 0x07);


    const shift = ((this._v >> 4) & 4) | (this._v & 2)

    this._attributeByte = ((this._ppuMemory.get(attributeAddress) >> shift) & 3) << 2;
  }

  private _fetchTileLowByte(): void {
    const fineY = (this._v >> 12) & 7;
    const baseNtAddress =
      getBaseNametableAddress(this.read$2000()) | (this._v & 0x0fff);
    const patternLowAddress = baseNtAddress + 0x10 * this._ntByte + fineY;
    this._tileLowByte = this._ppuMemory.get(patternLowAddress);
  }

  private _fetchTileHighByte(): void {
    const fineY = (this._v >> 12) & 7;
    const baseNtAddress =
      getBaseNametableAddress(this.read$2000()) | (this._v & 0x0fff);
    const patternHighAddress = baseNtAddress + 0x10 * this._ntByte + fineY + 8;

    this._tileHighByte = this._ppuMemory.get(patternHighAddress);
  }

  /*
  private _mergeTileBytesToPixelColorComponents(): ColorComponent[] {
    const mergedRowBits: number[] = this._mergeTileLowAndHighBytesToRowBits(
      this._tileLowByte,
      this._tileHighByte
    );
    const attributeByte: number = this._attributeByte;

    const ntAddress =
      getBaseNametableAddress(this._regPPUCTRL) | (this._vramAddress & 0x0fff);
    const hTileDelta = this._getHorizontalTileDelta(ntAddress);
    const vTileDelta = this._getVerticalTileDelta(ntAddress);

    const attributeGroupIndex = getAttributeGroupIndex(hTileDelta, vTileDelta);

    const basePaletteAddress = getBasePaletteAddress(
      attributeByte,
      attributeGroupIndex
    );

    const pixelColors: ColorComponent[] = [];
    for (let i = 0; i < mergedRowBits.length; i++) {
      const paletteAddress = this._getPaletteAddress(
        basePaletteAddress,
        mergedRowBits[i]
      );
      const colorByte = this._ppuMemory.get(paletteAddress);
      const colorComp = this._frameBuffer.getColor(colorByte);
      pixelColors.push(colorComp);
    }

    return pixelColors;
  }*/

  private _storeTileData() {
    let data = 0x0;
    for (let i = 0; i < 8; i++) {
      const attributeByte = this._attributeByte;
      const lowBit = (this._tileLowByte & 0x80) >> 7;
      const highBit = (this._tileHighByte & 0x80) >> 6;

      this._tileLowByte <<= 1;
      this._tileHighByte <<= 1;

      data <<= 4;
      data |= attributeByte | lowBit | highBit;
    }

    this._tileData |= data;
  }

  private _renderPixel() {
    const x = this._cycles - 1;
    const y = this._scanlines;

    // First 32 bits are reserved for the first tiledata
    // AAAA AAAA LHLH LHLH LHLH LHLH  
    const backgroundPixel =
      ((this._tileData >> 32) >> ((7 - this._regPPUSCROLL_x) * 4)) & 0x0f;

    // Now need to obtain the palette and then reach for the color offset...

    // backgorund color:

    this._frameBuffer.draw(
      y,
      x,
      NesPpuPalette[byteValue2HexString(backgroundPixel)]
    );
  }

  /*
  private _mergeTileLowAndHighBytesToRowBits(
    lowByte: number,
    highByte: number
  ): number[] {
    let mask = 0x1;

    const bits: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let j = 0; j < 8; j++) {
      const lowBit = (lowByte & (mask << j)) > 0 ? 1 : 0;
      const highBit = (highByte & (mask << j)) > 0 ? 1 : 0;

      const mergedBits = (highBit << 1) | lowBit;

      bits[7 - j] = mergedBits;
    }

    return bits;
  }*/

  /*
  private _drawColorComponentsToFrameBuffer(colors: ColorComponent[]) {
    const ntAddress =
      getBaseNametableAddress(this._regPPUCTRL) | (this._vramAddress & 0x0fff);
    let fbTileRow = parseInt(((ntAddress % 0x2000) / 0x20).toString());
    let fbTileCol = parseInt(((ntAddress % 0x2000) % 0x20).toString());

    const fbCol = fbTileCol * 8;
    const fbRow = fbTileRow * 8 + this._fineY;

    let shift = 0;
    for (let k = fbCol; k < fbCol + 8; k++) {
      this._frameBuffer.draw(fbRow, k, colors[shift]);
      shift++;
    }
  }
*/
  private _incrementX(): void {
    if ((this._v & 0x001f) === 31) {
      this._v &= 0xffe0; // wrap-back to 0.
    } else {
      this.incrementVramAddress();
    }

    this._coarseX = this._v & 0x001f;
  }

  private _incrementY(): void {
    if ((this._v & 0x7000) !== 0x7000) {
      // fine Y increment
      this._v += 0x1000;
    } else {
      this._v = this._v & 0x8fff;
      this._coarseY = (this._v & 0x3e0) >> 5;

      if (this._coarseY === 29) {
        this._coarseY = 0;
      } else if (this._coarseY === 31) {
        this._coarseY = 0;
      } else {
        this._coarseY++;
      }

      this._v = (this._v & 0xfc1f) | (this._coarseY << 5);
    }

    if (this._fineY < 7) {
      this._fineY++;
    } else {
      this._fineY = 0;
      this._coarseY++;

      if (this._coarseY > 29) {
        this._coarseY = 0;
        this._v = this._v += 32;
      }
    }
  }

  private _copyX() {
    this._v = (this._v & 0xfbe0) | (this._t & 0x041f);
  }

  private _copyY() {
    this._v = (this._v & 0x841f) | (this._t & 0x7be0);
  }

  public tick(): void {
    // add a cycle to the PPU
    this.addPpuCyclesInRun();
  }

  public run(): void {
    this.tick();

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
        this._tileData <<= 4;

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

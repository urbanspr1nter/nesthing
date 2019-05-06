import { PpuMemory } from "../memory/ppumemory";
import { OamMemory } from "../memory/oammemory";
import { ColorComponent } from "../nes/common/interface";
import {
  getBaseNametableAddress,
  getBasePaletteAddress,
  getAttributeGroupIndex
} from "./ppu.helpers";
import { PpuRegister } from "./ppu.interface";
import { FrameBuffer } from "../framebuffer/framebuffer";

// PPUCTRL (0x2000)
export enum PpuCtrlBits {
  NametableSelectLsb = 0,
  NametableSelectMsb = 1,
  Increment = 2,
  SpriteTileSelect = 3,
  BackgroundTileSelect = 4,
  SpriteHeight = 5,
  MasterToggle = 6,
  Vblank = 7
}

// PPUMASK (0x2001)
export enum PpuMaskBits {
  Greyscale = 0,
  ShowBackgroundInLeftmost = 1,
  ShowSpritesInLeftmost = 2,
  ShowBackground = 3,
  ShowSprites = 4,
  EmphasizeRed = 5,
  EmphasizeGreen = 6,
  EmphasizeBlue = 7
}

// PPUSTATUS (0x2002)
export enum PpuStatusBits {
  SpriteOverflow = 5,
  SpriteZeroHit = 6,
  Vblank = 7
}

export const IgnoredWritesBeforeWarmedUp = [
  PpuRegister.PPUCTRL,
  PpuRegister.PPUMASK,
  PpuRegister.PPUSCROLL,
  PpuRegister.PPUADDR
];

export class Ppu {
  private _frameBuffer: FrameBuffer;

  private _cpuNmiRequested: boolean;
  private _ppuMemory: PpuMemory;
  private _oamMemory: OamMemory;

  private _ppuDataReadBuffer: number;
  private _tVramAddress: number;
  private _vramAddress: number;
  private _isSecondWrite: boolean;

  private _cycles: number;
  private _totalCycles: number;
  private _currentCyclesInRun: number;
  private _scanlines: number;

  private _regPPUCTRL: number;
  private _regPPUMASK: number;
  private _regPPUSTATUS: number;

  private _fineY: number;
  private _coarseX: number;
  private _coarseY: number;
  private _ntByte: number;
  private _attributeByte: number;
  private _tileLowByte: number;
  private _tileHighByte: number;

  constructor(ppuMemory: PpuMemory) {
    this._frameBuffer = new FrameBuffer();

    this._cpuNmiRequested = false;
    this._ppuMemory = ppuMemory;
    this._oamMemory = new OamMemory();

    this._currentCyclesInRun = 0;
    this._totalCycles = 0;
    this._scanlines = -1;
    this._cycles = 0;

    this._vramAddress = 0;
    this._tVramAddress = 0;
    this._isSecondWrite = false;

    this._regPPUCTRL = 0;
    this._regPPUMASK = 0;
    this._regPPUSTATUS = 0;

    this._fineY = 0;
    this._coarseX = 0;
    this._coarseY = 0;
  }

  public vramAddress() {
    return this._vramAddress;
  }

  /**
   * Gets the framebuffer
   */
  public frameBuffer(): ColorComponent[][] {
    return this._frameBuffer.buffer;
  }

  public addPpuCyclesInRun(ppuCycles: number) {
    this._currentCyclesInRun += ppuCycles;
    this.addPpuCycles(ppuCycles);
  }

  public addPpuCycles(cycles: number) {
    this._cycles += cycles;

    if (this._cycles >= 341) {
      this._scanlines++;
      if (this._scanlines === 261) {
        this._scanlines = -1;
      }

      const remaining = this._cycles - 341;
      this._cycles = remaining;
    }
  }

  public getCycles(): number {
    return this._cycles;
  }

  public getScanlines() {
    return this._scanlines;
  }

  public write$2000(dataByte: number) {
    this._regPPUCTRL = dataByte & 0xff;
    if (
      (this._regPPUCTRL & (0x1 << PpuCtrlBits.Vblank)) > 0x0 &&
      this._isVblank()
    ) {
      this._cpuNmiRequested = true;
    }
  }

  public write$2001(dataByte: number) {
    this._regPPUMASK = dataByte & 0xff;
  }

  public write$2002(dataByte: number) {
    this._regPPUSTATUS = dataByte & 0xff;
  }

  public write$2006(dataByte: number) {
    if (!this._isSecondWrite) {
      this._tVramAddress = dataByte;
      this._isSecondWrite = true;
    } else {
      this._vramAddress = ((this._tVramAddress << 8) | dataByte) & 0x3fff;
      this._isSecondWrite = false;
    }
  }

  public write$2007(dataByte: number) {
    this._ppuMemory.set(this._vramAddress, dataByte);

    this.incrementVramAddress();
  }

  public read$2000() {
    return this._regPPUCTRL;
  }

  public read$2002() {
    const currentStatus = this._regPPUSTATUS;

    this._clearVblank();
    this._isSecondWrite = false;

    return currentStatus;
  }

  public read$2007() {
    const result = this._ppuDataReadBuffer;
    this._ppuDataReadBuffer = this._ppuMemory.get(this._vramAddress);

    this.incrementVramAddress();

    return result;
  }

  public incrementVramAddress() {
    const vramIncrement =
      (this._regPPUCTRL & (0x1 << PpuCtrlBits.Increment)) > 0x0 ? 32 : 1;

    this._vramAddress += vramIncrement;
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
    if ((this._regPPUCTRL & 0x80) > 0x0) {
      this._cpuNmiRequested = true;
    }
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
    const currentVramAddress = this._vramAddress;
    const ntAddress =
      getBaseNametableAddress(this._regPPUCTRL) | (currentVramAddress & 0x0fff);
    this._ntByte = this._ppuMemory.get(ntAddress);
  }

  private _fetchAttributeByte(): void {
    const currentVramAddress = this._vramAddress;
    const ntAddress =
      getBaseNametableAddress(this._regPPUCTRL) | (currentVramAddress & 0x0fff);
    const attributeAddress = this._convertNametableAddressToAttributeTableAddress(
      ntAddress
    );

    this._attributeByte = this._ppuMemory.get(attributeAddress);
  }

  private _fetchTileLowByte(): void {
    const baseNtAddress =
      getBaseNametableAddress(this._regPPUCTRL) | (this._vramAddress & 0x0fff);
    const patternLowAddress = baseNtAddress + 0x10 * this._ntByte + this._fineY;
    this._tileLowByte = this._ppuMemory.get(patternLowAddress);
  }

  private _fetchTileHighByte(): void {
    const baseNtAddress =
      getBaseNametableAddress(this._regPPUCTRL) | (this._vramAddress & 0x0fff);
    const patternHighAddress =
      baseNtAddress + 0x10 * this._ntByte + this._fineY + 8;

    this._tileHighByte = this._ppuMemory.get(patternHighAddress);
  }

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
  }

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
  }

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

  private _incrementX(): void {
    if ((this._vramAddress & 0x001f) === 31) {
      this._vramAddress &= 0xffe0; // wrap-back to 0.
    } else {
      this.incrementVramAddress();
      this._coarseX++;
    }
  }

  private _incrementY(): void {
    if (this._fineY < 7) {
      this._fineY++;
    } else {
      this._fineY = 0;
      this._coarseY++;

      if (this._coarseY > 29) {
        this._coarseY = 0;
      }

      this._vramAddress = (this._vramAddress & 0xfc1f) | (this._coarseY << 5);
    }
  }

  private _adjustXandY() {
    if (this._cycles % 8 === 0) {
      this._incrementX();
    }

    if (this._coarseX >= 32) {
      this._incrementY();
    }
  }

  public tick(): void {
      // add a cycle to the PPU
  }

  public run(): number {
    this._currentCyclesInRun = 0;

    if (this._scanlines === -1) {
      if (this._cycles === 0) {
        // Idle Cycle
        this.addPpuCyclesInRun(1);
      } else if (this._cycles === 1) {
        this._clearVblank();

        // FIXME: HACKKKKK!!!!
        this._vramAddress = 0x2000;

        this.addPpuCyclesInRun(1);
      } else if (this._cycles >= 280 && this._cycles <= 304) {
        // this._vramAddress =
          // (this._vramAddress & 0xfbe0) | (this._tVramAddress & 0x041f);
        this.addPpuCyclesInRun(1);
      } else {
        this.addPpuCyclesInRun(1);
      }
    } else if (this._scanlines >= 0 && this._scanlines <= 239) {
      if (this._cycles == 0) {
        this.addPpuCyclesInRun(1);
      } else if (this._cycles >= 1 && this._cycles <= 256) {
        /**
         * Here's how to actually process these cycles:
         *
         * Note that the vramAddress here is now set to the start of the nametable
         * base address. The CPU can only manipulate the VRAM address during VBLANK.
         *
         * That is why it is not good to actually write to $2006 when the PPU is not
         * in the VBLANK state because it can potentially disrupt this section of the
         * routine.
         *
         * Anyway, to process the nametable and fill our frame-buffer, we will need to
         * use 8 cycles per pattern tile in which we want to render.
         *
         * Then we do:
         *
         * 1. Fetch the pattern tile index at the nametable location. (2 cycles)
         * 2. Calculate the attribute address by converting the
         *    nametable location to attribute location. (2 cycles)
         * 3. Increment the VRAM address within the same row.
         * 4. Fetch the current low-byte of the pattern tile (8x1 row) (2 cycles)
         * 5. Fetch the current high-byte of the pattern tile (8x1 row) (2 cycles)
         *
         * As we can see, each "row" of the pattern tile is processed in 8 cycles.
         *
         * Therefore, 32 different pattern tiles are evaluated in a per row basis for
         * each scan line. (256 cycles / 8 cycles per row) = 32.
         *
         * Meaning, that for each scan line, it will visit that same pattern tile 8 times
         * due to pattern tiles being 8x8 pixels.
         */

        debugger;
        switch (this._cycles % 8) {
          case 1:
            this._fetchNametableByte();
            this.addPpuCyclesInRun(2);
            break;
          case 3:
            this._fetchAttributeByte();
            this.addPpuCyclesInRun(2);
            break;
          case 5:
            this._fetchTileLowByte();
            this.addPpuCyclesInRun(2);
            break;
          case 7:
            this._fetchTileHighByte();
            this.addPpuCyclesInRun(2);

            const rowColorComponents: ColorComponent[] = this._mergeTileBytesToPixelColorComponents();
            this._drawColorComponentsToFrameBuffer(rowColorComponents);
            break;
        }

        this._adjustXandY();
      } else if (this._cycles >= 257 && this._cycles <= 320) {
        // Garbage fetch
        this.addPpuCyclesInRun(2);
      } else if (this._cycles >= 321 && this._cycles <= 336) {
        this.addPpuCyclesInRun(2);
      } else if (this._cycles >= 337 && this._cycles <= 340) {
        this.addPpuCyclesInRun(1);
      }
    } else if (this._scanlines === 240) {
      this.addPpuCyclesInRun(1);
    } else if (this._scanlines >= 241 && this._scanlines <= 260) {
      if (this._scanlines === 241 && this._cycles === 0) {
        // Idle cycle.
        this.addPpuCyclesInRun(1);
      } else if (this._scanlines === 241 && this._cycles === 1) {
        this._setVblank();
        this._requestNmiIfNeeded();
        this.addPpuCyclesInRun(1);
      } else {
        this.addPpuCyclesInRun(1);
      }
    }
    return this._currentCyclesInRun;
  }
}

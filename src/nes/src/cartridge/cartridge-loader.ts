/**
 * cartridge-loader.ts
 *
 * Roger Ngo
 */

import { Cartridge } from "./cartridge";

// iNES file format
// (0-3) 4E 45 53 1A
//  NES(EOF) (4 bytes)
//
// (4) XX Size of PRG ROM in 16 KB units (1 bytes)
// (5) XX Size of CHR ROM in 8 KB units (1 byte, 0 means CHR RAM)
//
// (6) XX Flags - Mapper, Mirroring, Battery, Trainer
//  Bit 0 - Mirroring 0 - H, 1 V
//  Bit 1 - Battery Backed PRG RAM ($6000-%7FFF)
//  Bit 2 - 512 Byte Trainer at $7000-$71FF stored before PRG data
//  Bit 3 - Ignore mirroring control, or mirroring bit, and use 4 screen VRAM
//
// (7) XX - Mapper, VS/Playchoice, NES 2.0
//  Bit 0 - VS Unisystem
//  Bit 1 - Playchoice-10
//  Bit 2 -
//  Bit 3 - If bits 2 and 3 equal to 2 decimal, then flags 8 - 15 are in NES 2.0 format
//
// (8) XX - PRG RAM Size (rarely used) dont worry for now.
export interface iNesHeader {
  FormatHeader: number[];
  PrgRomUnits: number;
  ChrRomUnits: number;
  Control1: number;
  Control2: number;
  PrgRamSizeUnits: number; // 8 KB units
}

const PRG_UNIT_SIZE_BYTES = 16384;
const CHR_UNIT_SIZE_BYTES = 8192;
const PADDING_SIZE = 512;

/**
 * The cartridge loader takes in an array of bytes from an iNES ROM file.
 * It attempts to parse the bytes, and load the data into a cartridge object.
 *
 * What is returned are the appropriate PRG, CHR, mirroring and mapping of the
 * game to be emulated.
 */
export class CartridgeLoader {
  private _romBytes: number[];
  private _headerInfo: iNesHeader;

  constructor(romContents: number[]) {
    this._headerInfo = {
      FormatHeader: [0, 0, 0, 0],
      PrgRomUnits: 0,
      ChrRomUnits: 0,
      Control1: 0,
      Control2: 0,
      PrgRamSizeUnits: 0
    };

    this._romBytes = [];
    romContents.forEach(value => {
      this._romBytes.push(value);
    });

    this._getHeader();
  }

  /**
   * Makes the cartridge out of the bytes that were loaded.
   */
  public makeCartridge(): Cartridge {
    if (!this._verifyNesHeader(this._headerInfo.FormatHeader)) {
      throw Error("Invalid NES ROM file.");
    }

    let romData = this._romBytes.slice(16);
    let filePointer = 0;

    const mapper1 = this._headerInfo.Control1 >>> 4;
    const mapper2 = this._headerInfo.Control2 >>> 4;
    const mapper = mapper1 | (mapper2 << 4);

    const mirror1 = this._headerInfo.Control1 & 1;
    const mirror2 = (this._headerInfo.Control1 >>> 3) & 1;
    const mirror = mirror1 | (mirror2 << 1);

    const battery = (this._headerInfo.Control1 >>> 1) & 1;

    if ((this._headerInfo.Control1 & 4) === 4) {
      for (let i = 0; i < PADDING_SIZE; i++) {
        filePointer++;
      }
    }

    const prg = [];
    const prgRomSize = this._headerInfo.PrgRomUnits * PRG_UNIT_SIZE_BYTES;
    for (let i = 0; i < prgRomSize; i++) {
      prg.push(romData[filePointer]);
      filePointer++;
    }

    const chr = [];
    const chrRomSize = this._headerInfo.ChrRomUnits * CHR_UNIT_SIZE_BYTES;
    for (let i = 0; i < chrRomSize; i++) {
      chr.push(romData[filePointer]);
      filePointer++;
    }

    if (this._headerInfo.ChrRomUnits === 0) {
      for (let i = 0; i < CHR_UNIT_SIZE_BYTES; i++) {
        chr.push(0);
      }
    }

    return new Cartridge(prg, chr, mapper, mirror, battery);
  }

  private _getHeader() {
    this._headerInfo.FormatHeader = this._romBytes.slice(0, 4);
    this._headerInfo.PrgRomUnits = this._romBytes[4] & 0xff;
    this._headerInfo.ChrRomUnits = this._romBytes[5] & 0xff;
    this._headerInfo.Control1 = this._romBytes[6] & 0xff;
    this._headerInfo.Control2 = this._romBytes[7] & 0xff;
    this._headerInfo.PrgRamSizeUnits = this._romBytes[8] & 0xff;
  }

  private _verifyNesHeader(formatHeader: number[]): boolean {
    // 4E 45 53 1A
    return (
      formatHeader.length === 4 &&
      formatHeader[0] === 0x4e &&
      formatHeader[1] === 0x45 &&
      formatHeader[2] === 0x53 &&
      formatHeader[3] === 0x1a
    );
  }
}

import { Memory } from "./memory";
import { PpuMemory } from "./ppu/ppumemory";
import { Cartridge } from "./cartridge";

// iNES file format
// (0-3) 4E 45 53 1A
//  NES(EOF) (4 bytes)
//
// (4) XX Size of PRG ROM in 16 KB units (1 bytes)
//
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
// (8) XX - PRG RAM Size (rarely used) dont worry for now.
//
// (9) XX - TV System (dont care for now)
// (10-15) - Unused

export interface iNesHeader {
  FormatHeader: number[];
  PrgRomUnits: number;
  ChrRomUnits: number;
  Control1: number;
  Control2: number;
  PrgRamSizeUnits: number; // 8 KB units
}

export class CartLoader {
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

  public makeCartridge(): Cartridge {
    let romData = this._romBytes.slice(16);
    var filePointer = 0;

    var mapper1 = this._headerInfo.Control1 >>> 4;
    var mapper2 = this._headerInfo.Control2 >>> 4;
    var mapper = (mapper1 | (mapper2 << 4));

    var mirror1 = this._headerInfo.Control1 & 1;
    var mirror2 = (this._headerInfo.Control1 >>> 3) & 1;
    var mirror = (mirror1 | (mirror2 << 1));

    var battery = (this._headerInfo.Control1 >>> 1) & 1;

    if((this._headerInfo.Control1 & 4) === 4) {
      for(let  i = 0; i < 512; i++) {
        filePointer++;
      }
    }

    var prg = [];
    var prgRomSize = this._headerInfo.PrgRomUnits * 16384;
    for(let i = 0; i < prgRomSize; i++) {
      prg.push(romData[filePointer]);
      filePointer++;
    }

    var chr = [];
    var chrRomSize = this._headerInfo.ChrRomUnits * 8192;
    for(let i = 0; i < chrRomSize; i++) {
      chr.push(romData[filePointer]);
      filePointer++;
    }

    if(this._headerInfo.ChrRomUnits === 0) {
      for(let i = 0; i < 8192; i++) {
        chr.push(0);
      }
    }

    return new Cartridge(prg, chr, mapper, mirror, battery);
  }

  private _getHeader() {
    this._headerInfo.FormatHeader = this._romBytes.slice(0, 4);
    this._headerInfo.PrgRomUnits = this._romBytes[4];
    this._headerInfo.ChrRomUnits = this._romBytes[5];
    this._headerInfo.Control1 = this._romBytes[6];
    this._headerInfo.Control2 = this._romBytes[7];
    this._headerInfo.PrgRamSizeUnits = this._romBytes[8];
  }
}

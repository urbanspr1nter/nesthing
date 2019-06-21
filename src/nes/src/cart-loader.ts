import { Memory } from "./memory";
import { PpuMemory } from "./ppumemory";

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
  PrgRomUnits: number;
  ChrRomUnits: number;
  Mirroring: number;
  BatteryBacked: boolean;
  HasTrainer: boolean;
  IgnoreMirroring: boolean;
}

export class CartLoader {
  private _romBytes: number[];
  private _headerInfo: iNesHeader;

  constructor(romContents: number[]) {
    this._headerInfo = {
      PrgRomUnits: 0,
      ChrRomUnits: 0,
      Mirroring: 0,
      BatteryBacked: false,
      HasTrainer: false,
      IgnoreMirroring: false
    };

    this._romBytes = [];
    romContents.forEach(value => {
      this._romBytes.push(value);
    });

    this._getHeader();
  }

  public loadCartridgeData(cpuMemory: Memory, ppuMemory: PpuMemory) {
    let romData;
    // NES in header, so it is a .nes format.
    romData = this._romBytes.slice(16);

    let startAddressPrgBank0 = 0x8000;
    for (let address = 0; address < 0x4000; address++) {
      cpuMemory.set(startAddressPrgBank0, romData[address]);
      startAddressPrgBank0++;
    }

    let startAddressPrgBank1 = 0xc000;
    for (let address = 0; address < 0x4000; address++) {
      cpuMemory.set(startAddressPrgBank1, romData[address]);
      startAddressPrgBank1++;
    }

    console.log(`cpuMemory ${cpuMemory.get(0xfffc)} ${cpuMemory.get(0xfffd)}`)

    let startAddressChrBank0 = 0x0;
    for (let address = 0x8000; address < 0x8000 + 0x2000; address++) {
      ppuMemory.set(startAddressChrBank0, romData[address]);
      startAddressChrBank0++;
    }
  }

  private _getHeader() {
    this._headerInfo.PrgRomUnits = this._romBytes[4];
    this._headerInfo.ChrRomUnits = this._romBytes[5];
    this._headerInfo.Mirroring = (this._romBytes[6] & 0x0) === 0x0 ? 0 : 1;
    this._headerInfo.BatteryBacked =
      (this._romBytes[6] & 0x02) === 0x0 ? false : true;
    this._headerInfo.HasTrainer =
      (this._romBytes[6] & 0x04) === 0x0 ? false : true;
    this._headerInfo.IgnoreMirroring =
      (this._romBytes[6] & 0x08) === 0x0 ? false : true;
  }
}

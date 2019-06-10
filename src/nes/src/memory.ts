import { Ppu } from "./ppu";
import { Controller } from "./controller";

/**
 * CPU MEMORY MAP
 *
 * $0000 - $07FF ($0800) - RAM
 * $0800 - $0FFF ($0800) - Mirror of RAM
 * $1000 - $17FF ($0800) - Mirror of RAM
 * $1800 - $1FFF ($0800) - Mirror of RAM
 * $2000 - $2007 ($0008) - PPU Registers
 * $2008 - $3FFF ($1FF8) - Mirror of PPU Registers
 * $4000 - $4017 ($0018) - APU / IO Registers
 * $4018 - $401F ($0008) - APU / IO Functionality Disabled
 * $4020 - $FFFF ($BFE0) - Cartridge space: PRG RAOM, PRG RAM, mapper registers
 */
export class Memory {
  private _memory: number[];

  private _ppu: Ppu;
  private _controller: Controller;

  constructor(ppu: Ppu, controller: Controller) {
    this._memory = [];
    this._ppu = ppu;
    this._controller = controller;
  }

  public bits(): number[] {
    return this._memory;
  }

  public set = (address: number, value: number): void => {
    value = value & 0xff;

    if (address < 0x2000) {
      this._memory[address % 0x0800] = value;
    } else if (address >= 0x2000 && address <= 0x3fff) {
      // PPU registers
      const decodedAddress = 0x2000 + (address % 8);
      if (decodedAddress === 0x2000) {
        this._ppu.write$2000(value);
      } else if (decodedAddress === 0x2001) {
        this._ppu.write$2001(value);
      } else if (decodedAddress === 0x2003) {
        this._ppu.write$2003(value);
      } else if (decodedAddress === 0x2004) {
        this._ppu.write$2004(value);
      } else if (decodedAddress === 0x2005) {
        this._ppu.write$2005(value);
      } else if (decodedAddress === 0x2006) {
        this._ppu.write$2006(value);
      } else if (decodedAddress === 0x2007) {
        this._ppu.write$2007(value);
      }
    } else if (address === 0x4014) {
      return this._ppu.write$4014(value);
    } else if (address === 0x4016) {
      // Write 1 $4016 to signal the controller to poll its input
      // Write 0 to $4016 to finish the poll
      // 4016/4017 becomes ready for polling
      this._controller.write(value);
    } else {
      this._memory[address & 0xffff] = value;
    }
  };

  public get = (address: number): number => {
    if (address < 0x2000) {
      return this._memory[address % 0x800] & 0xff;
    } else if (address >= 0x2000 && address <= 0x3fff) {
      const decodedAddress = 0x2000 + (address % 8);
      if (decodedAddress === 0x2002) {
        return this._ppu.read$2002() & 0xff;
      } else if (decodedAddress === 0x2004) {
        return this._ppu.read$2004() & 0xff;
      } else if (decodedAddress === 0x2007) {
        return this._ppu.read$2007() & 0xff;
      } else {
        return 0;
      }
    } else if (address === 0x4016) {
      // Read controller 1
      return this._controller.read();
    } else if (address === 0x4017) {
      // read controller 2
    }
    return this._memory[address & 0xffff] & 0xff;
  };
}

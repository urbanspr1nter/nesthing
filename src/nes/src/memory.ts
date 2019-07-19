import { Ppu } from "./ppu/ppu";
import { Controller } from "./controller";
import { Apu } from "./apu/apu";
import { IMapper } from "./mapper";

export interface MemoryState {
  data: number[];
}

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
 * $4020 - $FFFF ($BFE0) - Cartridge space: PRG ROM, PRG RAM, mapper registers
 */
export class Memory {
  private _memory: number[];

  private _mapper: IMapper;
  private _apu: Apu;
  private _ppu: Ppu;
  private _controllerOne: Controller;
  private _controllerTwo: Controller;

  constructor(
    ppu: Ppu,
    apu: Apu,
    mapper: IMapper,
    controllerOne: Controller,
    controllerTwo: Controller
  ) {
    this._memory = [];
    for(let i = 0; i < 0x10000; i++) {
      this._memory.push(0);
    }

    this._mapper = mapper;
    this._ppu = ppu;
    this._apu = apu;
    this._controllerOne = controllerOne;
    this._controllerTwo = controllerTwo;
  }

  public save(): MemoryState {
    return {
      data: this._memory
    }
  }

  public load(state: MemoryState) {
    this._memory = state.data;
  }

  public set(address: number, value: number) {
    var cleanAddress = address & 0xffff;
    var cleanValue = value & 0xff;

    if (cleanAddress < 0x2000) {
      this._memory[cleanAddress % 0x0800] = cleanValue;
    } else if (cleanAddress >= 0x2000 && cleanAddress <= 0x3fff) {
      // PPU registers
      const decodedAddress = 0x2000 + (cleanAddress % 8);
      this._ppu.write(decodedAddress, cleanValue);
    } else if (cleanAddress < 0x4014) {
      this._apu.write$addr(cleanAddress, cleanValue);
    } else if (cleanAddress === 0x4014) {
      this._ppu.write$4014(cleanValue);
    } else if (cleanAddress === 0x4016) {
      this._controllerOne.write(cleanValue);
      this._controllerTwo.write(cleanValue);
    } else if (cleanAddress >= 0x4000 && cleanAddress <= 0x400f) {
      this._apu.write$addr(cleanAddress, cleanValue);
    } else if (cleanAddress === 0x4015 || cleanAddress === 0x4017) {
      this._apu.write$addr(cleanAddress, cleanValue);
    } else if (cleanAddress >= 0x6000) {
      this._mapper.write(cleanAddress, cleanValue);
    } else {
      this._memory[cleanAddress] = cleanValue;
    }
  }

  public get(address: number) {
    var cleanAddress = address & 0xffff;

    if (cleanAddress < 0x2000) {
      return this._memory[cleanAddress % 0x800] & 0xff;
    } else if (cleanAddress >= 0x2000 && cleanAddress <= 0x3fff) {
      const decodedAddress = 0x2000 + (cleanAddress % 8);
      return this._ppu.read(decodedAddress);
    } else if (cleanAddress === 0x4015) {
      return this._apu.read$addr(cleanAddress);
    } else if (cleanAddress === 0x4016) {
      // Read controller 1
      return this._controllerOne.read();
    } else if (cleanAddress === 0x4017) {
      // read controller 2
      return this._controllerTwo.read();
    } else if (cleanAddress >= 0x6000) {
      return this._mapper.read(cleanAddress);
    }
    return this._memory[cleanAddress];
  }
}

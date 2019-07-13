import { Ppu } from "./ppu";
import { Controller, ControllerPlayer } from "./controller";
import { Apu } from "./apu";
import { IMapper } from "./mapper";

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
    this._mapper = mapper;
    this._ppu = ppu;
    this._apu = apu;
    this._controllerOne = controllerOne;
    this._controllerTwo = controllerTwo;
  }

  public bits(): number[] {
    return this._memory;
  }

  public set(address: number, value: number) {
    value = value & 0xff;

    if (address < 0x2000) {
      this._memory[address % 0x0800] = value;
    } else if (address >= 0x2000 && address <= 0x3fff) {
      // PPU registers
      const decodedAddress = 0x2000 + (address % 8);
      this._ppu.write(decodedAddress, value);
    } else if (address < 0x4014) {
      this._apu.write$addr(address, value);
    } else if (address === 0x4014) {
      this._ppu.write$4014(value);
    } else if (address === 0x4016) {
      this._controllerOne.write(value);
      this._controllerTwo.write(value);
    } else if (address >= 0x4000 && address <= 0x400f) {
      this._apu.write$addr(address, value);
    } else if (address === 0x4015 || address === 0x4017) {
      this._apu.write$addr(address, value);
    } else if (address >= 0x6000) {
      this._mapper.write(address, value);
    } else {
      this._memory[address & 0xffff] = value;
    }
  }

  public get(address: number) {
    address &= 0xffff;

    if (address < 0x2000) {
      return this._memory[address % 0x800] & 0xff;
    } else if (address >= 0x2000 && address <= 0x3fff) {
      const decodedAddress = 0x2000 + (address % 8);
      return this._ppu.read(decodedAddress);
    } else if (address === 0x4015) {
      return this._apu.read$addr(address);
    } else if (address === 0x4016) {
      // Read controller 1
      return this._controllerOne.read();
    } else if (address === 0x4017) {
      // read controller 2
      return this._controllerTwo.read();
    } else if (address >= 0x6000) {
      return this._mapper.read(address);
    }
    return this._memory[address & 0xffff] & 0xff;
  }
}

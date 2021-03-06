/**
 * cartridge.ts
 * 
 * Roger Ngo
 */
import { CartridgeState } from "./constants";

/**
 * Represents the data of the ROM file as a cartridge.
 */
export class Cartridge {
  private _prg: number[];
  private _chr: number[];
  private _sram: number[];
  private _mapper: number;
  private _mirror: number;
  private _battery: number;

  constructor(
    prg: number[],
    chr: number[],
    mapper: number,
    mirror: number,
    battery: number
  ) {
    this._prg = prg;
    this._chr = chr;
    this._mapper = mapper;
    this._mirror = mirror;
    this._battery = battery;

    this._sram = [];
    for (let i = 0; i < 0x2000; i++) {
      this._sram[i] = 0;
    }
  }

  public load(state: CartridgeState) {
    if(state.chr) {
      this._chr = state.chr;
    }
    this._sram = state.sram;
    this._mapper = state.mapper;
    this._mirror = state.mirror;
    this._battery = state.battery;
  }

  public save(): CartridgeState {
    return {
      chr: this._chr,
      sram: this._sram,
      mapper: this.mapper,
      mirror: this._mirror,
      battery: this._battery
    };
  }

  get prg() {
    return this._prg;
  }

  get chr() {
    return this._chr;
  }

  get sram() {
    return this._sram;
  }

  get mapper() {
    return this._mapper & 0xff;
  }

  get mirror() {
    return this._mirror & 0xff;
  }

  get battery() {
    return this._battery & 0xff;
  }

  set prg(value: number[]) {
    this._prg = value;
  }

  set chr(value: number[]) {
    this._chr = value;
  }

  set sram(value: number[]) {
    this._sram = value;
  }

  set mapper(value: number) {
    this._mapper = value & 0xff;
  }

  set mirror(value: number) {
    this._mirror = value & 0xff;
  }

  set battery(value: number) {
    this._battery = value & 0xff;
  }
}

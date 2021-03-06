import { Cpu } from "../cpu/cpu";
import { ApuDmcTable, Dmc } from "./constants";

export class DmcSample {
  private _dmc: Dmc;

  constructor(cpu: Cpu) {
    this._dmc = {
      Cpu: cpu,
      Enabled: false,
      Value: 0,
      SampleAddress: 0,
      SampleLength: 0,
      CurrentAddress: 0,
      CurrentLength: 0,
      ShiftRegister: 0,
      BitCount: 0,
      TickPeriod: 0,
      TickValue: 0,
      Loop: false,
      Irq: false
    };
  }

  get dmc() {
    return this._dmc;
  }

  public save() {
    return { ...this._dmc, ...{ Cpu: undefined } };
  }

  public load(state: Dmc) {
    var cpu = this._dmc.Cpu;
    this._dmc = state;
    this._dmc.Cpu = cpu;
  }

  public writeControl(value: number) {
    this._dmc.Irq = (value & 0x80) === 0x80;
    this._dmc.Loop = (value & 0x40) === 0x40;
    this._dmc.TickPeriod = ApuDmcTable[value & 0x0f];
  }

  public writeValue(value: number) {
    this._dmc.Value = value & 0x7f;
  }

  public writeAddress(value: number) {
    const bValue = value & 0xff;

    this._dmc.SampleAddress = 0xc000 | (bValue << 6);
  }

  public writeLength(value: number) {
    this._dmc.SampleLength = (value << 4) | 1;
  }

  public restart() {
    this._dmc.CurrentAddress = this._dmc.SampleAddress;
    this._dmc.CurrentLength = this._dmc.SampleLength;
  }

  public stepTimer() {
    if (!this._dmc.Enabled) {
      return;
    }

    this.stepReader();
    if (this._dmc.TickValue === 0) {
      this._dmc.TickValue = this._dmc.TickPeriod;
      this.stepShifter();
    } else {
      this._dmc.TickValue--;
    }
  }

  public stepReader() {
    if (this._dmc.CurrentLength > 0 && this._dmc.BitCount === 0) {
      this._dmc.Cpu.stallCycles = this._dmc.Cpu.stallCycles + 4;
      this._dmc.ShiftRegister = this._dmc.Cpu.memRead(this._dmc.CurrentAddress);
      this._dmc.BitCount = 8;
      this._dmc.CurrentAddress++;
      if (this._dmc.CurrentAddress === 0) {
        this._dmc.CurrentAddress = 0x8000;
      }

      this._dmc.CurrentLength--;
      if (this._dmc.CurrentLength === 0 && this._dmc.Loop) {
        this.restart();
      }
    }
  }

  public stepShifter() {
    if (this._dmc.BitCount === 0) {
      return;
    }

    if ((this._dmc.ShiftRegister & 1) === 1) {
      if (this._dmc.Value <= 125) {
        this._dmc.Value += 2;
      }
    } else {
      if (this._dmc.Value >= 2) {
        this._dmc.Value -= 2;
      }
    }

    this._dmc.ShiftRegister >>>= 1;
    this._dmc.BitCount--;
  }

  public output() {
    return this._dmc.Value;
  }
}


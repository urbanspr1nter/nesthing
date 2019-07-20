import { ApuTriangleTable, ApuLengthTable, Triangle } from "./constants";

export class TriangleWave {
  private _triangle: Triangle;

  constructor() {
    this._triangle = {
      Enabled: false,
      LengthEnabled: false,
      LengthValue: 0,
      TimerPeriod: 0,
      TimerValue: 0,
      DutyValue: 0,
      CounterPeriod: 0,
      CounterValue: 0,
      CounterReload: false
    };
  }

  get triangle() {
    return this._triangle;
  }

  public save() {
    return this._triangle;
  }

  public load(state: Triangle) {
    this._triangle = state;
  }

  public writeControl(value: number) {
    this._triangle.LengthEnabled = ((value >>> 7) & 1) === 0;
    this._triangle.CounterPeriod = value & 0x7f;
  }

  public writeTimerLow(value: number) {
    this._triangle.TimerPeriod = (this._triangle.TimerPeriod & 0xff00) | value;
  }

  public writeTimerHigh(value: number) {
    this._triangle.LengthValue = ApuLengthTable[value >>> 3];
    this._triangle.TimerPeriod =
      (this._triangle.TimerPeriod & 0x00ff) | ((value << 8) & 0xffff);
    this._triangle.TimerValue = this._triangle.TimerPeriod;
    this._triangle.CounterReload = true;
  }

  public stepTimer() {
    if (this._triangle.TimerValue === 0) {
      this._triangle.TimerValue = this._triangle.TimerPeriod;
      if (this._triangle.LengthValue > 0 && this._triangle.CounterValue > 0) {
        this._triangle.DutyValue = (this._triangle.DutyValue + 1) % 32;
      }
    } else {
      this._triangle.TimerValue--;
    }
  }

  public stepLength() {
    if (this._triangle.LengthEnabled && this._triangle.LengthValue > 0) {
      this._triangle.LengthValue--;
    }
  }

  public stepCounter() {
    if (this._triangle.CounterReload) {
      this._triangle.CounterValue = this._triangle.CounterPeriod;
    } else if (this._triangle.CounterValue > 0) {
      this._triangle.CounterValue--;
    }
    if (this._triangle.LengthEnabled) {
      this._triangle.CounterReload = false;
    }
  }

  public output() {
    if (!this._triangle.Enabled) {
      return 0;
    }
    if (this._triangle.LengthValue === 0) {
      return 0;
    }
    if (this._triangle.CounterValue === 0) {
      return 0;
    }

    return ApuTriangleTable[this._triangle.DutyValue] & 0xff;
  }
}


import { ApuTriangleTable, ApuLengthTable } from "./constants";

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

  public writeControl(value: number) {
    const bValue = value & 0xff;

    this._triangle.LengthEnabled = ((bValue >>> 7) & 1) === 0;
    this._triangle.CounterPeriod = value & 0x7f;
  }

  public writeTimerLow(value: number) {
    const bValue = value & 0xff;

    this._triangle.TimerPeriod = (this._triangle.TimerPeriod & 0xff00) | bValue;
  }

  public writeTimerHigh(value: number) {
    const bValue = value & 0xff;

    this._triangle.LengthValue = ApuLengthTable[bValue >>> 3];
    this._triangle.TimerPeriod =
      (this._triangle.TimerPeriod & 0x00ff) | (bValue << 8);
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

    return ApuTriangleTable[this._triangle.DutyValue];
  }
}

export interface Triangle {
  Enabled: boolean;
  LengthEnabled: boolean;
  LengthValue: number;
  TimerPeriod: number;
  TimerValue: number;
  DutyValue: number;
  CounterPeriod: number;
  CounterValue: number;
  CounterReload: boolean;
}

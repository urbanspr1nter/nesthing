import { ApuLengthTable, ApuDutyTable } from "./constants";

export class PulseWave {
  private _p: Pulse;

  constructor(channel: number) {
    this._p = {
      Enabled: false,
      Channel: channel,
      LengthEnabled: false,
      LengthValue: 0,
      TimerPeriod: 0,
      TimerValue: 0,
      DutyMode: 0,
      DutyValue: 0,
      SweepReload: false,
      SweepEnabled: false,
      SweepNegate: false,
      SweepShift: 0,
      SweepPeriod: 0,
      SweepValue: 0,
      EnvelopeEnabled: false,
      EnvelopeLoop: false,
      EnvelopeStart: false,
      EnvelopePeriod: 0,
      EnvelopeValue: 0,
      EnvelopeVolume: 0,
      ConstantVolume: 0
    };
  }

  get pulse() {
    return this._p;
  }

  public writeControl(value: number) {
    const bValue = value & 0xff;

    this._p.DutyMode = (bValue >>> 6) & 3;
    this._p.LengthEnabled = ((bValue >>> 5) & 1) === 0;
    this._p.EnvelopeLoop = ((bValue >>> 5) & 1) === 0;
    this._p.EnvelopeEnabled = ((bValue >>> 4) & 1) === 0;
    this._p.EnvelopePeriod = bValue & 15;
    this._p.ConstantVolume = bValue & 15;
    this._p.EnvelopeStart = true;
  }

  public writeSweep(value: number) {
    const bValue = value & 0xff;

    this._p.SweepEnabled = ((bValue >>> 7) & 1) === 1;
    this._p.SweepPeriod = ((bValue >>> 4) & 7) + 1;
    this._p.SweepNegate = ((bValue >>> 3) & 1) === 1;
    this._p.SweepShift = value & 7;
    this._p.SweepReload = true;
  }

  public writeTimerLow(value: number) {
    const bValue = value & 0xff;

    this._p.TimerPeriod = ((this._p.TimerPeriod & 0xff00) | bValue) & 0xffff;
  }

  public writeTimerHigh(value: number) {
    const bValue = value & 0xff;

    this._p.LengthValue = ApuLengthTable[bValue >>> 3];
    this._p.TimerPeriod =
      ((this._p.TimerPeriod & 0x00ff) | ((bValue & 7) << 8)) & 0xffff;
    this._p.EnvelopeStart = true;
    this._p.DutyValue = 0;
  }

  public stepTimer() {
    if (this._p.TimerValue === 0) {
      this._p.TimerValue = this._p.TimerPeriod;
      this._p.DutyValue = (this._p.DutyValue + 1) % 8;
    } else {
      this._p.TimerValue--;
    }
  }

  public stepEnvelope() {
    if (this._p.EnvelopeStart) {
      this._p.EnvelopeVolume = 15;
      this._p.EnvelopeValue = this._p.EnvelopePeriod;
      this._p.EnvelopeStart = false;
    } else if (this._p.EnvelopeValue > 0) {
      this._p.EnvelopeValue--;
    } else {
      if (this._p.EnvelopeVolume > 0) {
        this._p.EnvelopeVolume--;
      } else if (this._p.EnvelopeLoop) {
        this._p.EnvelopeVolume = 15;
      }
      this._p.EnvelopeValue = this._p.EnvelopePeriod;
    }
  }

  public stepSweep() {
    if (this._p.SweepReload) {
      if (this._p.SweepEnabled && this._p.SweepValue === 0) {
        this.sweep();
      }
      this._p.SweepValue = this._p.SweepPeriod;
      this._p.SweepReload = false;
    } else if (this._p.SweepValue > 0) {
      this._p.SweepValue--;
    } else {
      if (this._p.SweepEnabled) {
        this.sweep();
      }
      this._p.SweepValue = this._p.SweepPeriod;
    }
  }

  public stepLength() {
    if (this._p.LengthEnabled && this._p.LengthValue > 0) {
      this._p.LengthValue--;
    }
  }

  public sweep() {
    const delta = this._p.TimerPeriod >>> this._p.SweepShift;
    if (this._p.SweepNegate) {
      this._p.TimerPeriod -= delta;
      if (this._p.Channel === 1) {
        this._p.TimerPeriod--;
      }
    } else {
      this._p.TimerPeriod += delta;
    }
  }

  public output() {
    if (!this._p.Enabled) {
      return 0;
    }
    if (this._p.LengthValue === 0) {
      return 0;
    }

    if (ApuDutyTable[this._p.DutyMode][this._p.DutyValue] === 0) {
      return 0;
    }

    if (this._p.TimerPeriod < 8 || this._p.TimerPeriod > 0x7ff) {
      return 0;
    }

    if (this._p.EnvelopeEnabled) {
      return this._p.EnvelopeVolume;
    } else {
      return this._p.ConstantVolume;
    }
  }
}

export interface Pulse {
  Enabled: boolean;
  Channel: number;
  LengthEnabled: boolean;
  LengthValue: number;
  TimerPeriod: number;
  TimerValue: number;
  DutyMode: number;
  DutyValue: number;
  SweepReload: boolean;
  SweepEnabled: boolean;
  SweepNegate: boolean;
  SweepShift: number;
  SweepPeriod: number;
  SweepValue: number;
  EnvelopeEnabled: boolean;
  EnvelopeLoop: boolean;
  EnvelopeStart: boolean;
  EnvelopePeriod: number;
  EnvelopeValue: number;
  EnvelopeVolume: number;
  ConstantVolume: number;
}

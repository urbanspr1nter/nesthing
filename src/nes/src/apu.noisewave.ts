import { ApuNoiseTable, ApuLengthTable } from "./constants";

export class NoiseWave {
  private _noise: Noise;

  constructor() {
    this._noise = {
      Enabled: false,
      Mode: false,
      ShiftRegister: 1,
      LengthEnabled: false,
      LengthValue: 0,
      TimerPeriod: 0,
      TimerValue: 0,
      EnvelopeEnabled: false,
      EnvelopeLoop: false,
      EnvelopeStart: false,
      EnvelopePeriod: 0,
      EnvelopeValue: 0,
      EnvelopeVolume: 0,
      ConstantVolume: 0
    };
  }

  get noise() {
    return this._noise;
  }

  public writeControl(value: number) {
    const bValue = value & 0xff;

    this._noise.LengthEnabled = ((bValue >>> 5) & 1) === 0;
    this._noise.EnvelopeLoop = ((bValue >>> 5) & 1) === 1;
    this._noise.EnvelopeEnabled = ((bValue >>> 4) & 1) === 0;
    this._noise.EnvelopePeriod = bValue & 15;
    this._noise.ConstantVolume = bValue & 15;
    this._noise.EnvelopeStart = true;
  }

  public writePeriod(value: number) {
    const bValue = value & 0xff;

    this._noise.Mode = (bValue & 0x80) === 0x80;
    this._noise.TimerPeriod = ApuNoiseTable[bValue & 0x0f];
  }

  public writeLength(value: number) {
    const bValue = value & 0xff;

    this._noise.LengthValue = ApuLengthTable[bValue >>> 3];
    this._noise.EnvelopeStart = true;
  }

  public stepTimer() {
    if (this._noise.TimerValue === 0) {
      this._noise.TimerValue = this._noise.TimerPeriod;
      let shift = 0;
      if (this._noise.Mode) {
        shift = 6;
      } else {
        shift = 1;
      }

      const b1 = this._noise.ShiftRegister & 1;
      const b2 = (this._noise.ShiftRegister >>> 3) & 1;

      this._noise.ShiftRegister >>>= 1;
      this._noise.ShiftRegister |= (b1 ^ b2) << 14;
    } else {
      this._noise.TimerValue--;
    }
  }

  public stepEnvelope() {
    if (this._noise.EnvelopeStart) {
      this._noise.EnvelopeVolume = 15;
      this._noise.EnvelopeValue = this._noise.EnvelopePeriod;
      this._noise.EnvelopeStart = false;
    } else if (this._noise.EnvelopeValue > 0) {
      this._noise.EnvelopeValue--;
    } else {
      if (this._noise.EnvelopeVolume > 0) {
        this._noise.EnvelopeVolume--;
      } else if (this._noise.EnvelopeLoop) {
        this._noise.EnvelopeVolume = 15;
      }

      this._noise.EnvelopeValue = this._noise.EnvelopePeriod;
    }
  }

  public stepLength() {
    if (this._noise.LengthEnabled && this._noise.LengthValue > 0) {
      this._noise.LengthValue--;
    }
  }

  public output() {
    if (!this._noise.Enabled) {
      return 0;
    }
    if (this._noise.LengthValue === 0) {
      return 0;
    }

    if ((this._noise.ShiftRegister & 1) === 1) {
      return 0;
    }

    if (this._noise.EnvelopeEnabled) {
      return this._noise.EnvelopeVolume;
    } else {
      return this._noise.ConstantVolume;
    }
  }
}

export interface Noise {
  Enabled: boolean;
  Mode: boolean;
  ShiftRegister: number;
  LengthEnabled: boolean;
  LengthValue: number;
  TimerPeriod: number;
  TimerValue: number;
  EnvelopeEnabled: boolean;
  EnvelopeLoop: boolean;
  EnvelopeStart: boolean;
  EnvelopePeriod: number;
  EnvelopeValue: number;
  EnvelopeVolume: number;
  ConstantVolume: number;
}

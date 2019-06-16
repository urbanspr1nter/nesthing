import { Cpu } from "./cpu";
import { InterruptRequestType } from "./cpu.interface";
import { FilterChain } from "./filterchain";

const frameCounterRate = 1789773 / 240.0;

interface Pulse {
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

interface Triangle {
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

interface Noise {
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

interface Dmc {
  Cpu: Cpu;
  Enabled: boolean;
  Value: number;
  SampleAddress: number;
  SampleLength: number;
  CurrentAddress: number;
  CurrentLength: number;
  ShiftRegister: number;
  BitCount: number;
  TickPeriod: number;
  TickValue: number;
  Loop: boolean;
  Irq: boolean;
}

const lengthTable = [
  10,
  254,
  20,
  2,
  40,
  4,
  80,
  6,
  160,
  8,
  60,
  10,
  14,
  12,
  26,
  14,
  12,
  16,
  24,
  18,
  48,
  20,
  96,
  22,
  192,
  24,
  72,
  26,
  16,
  28,
  32,
  30
];

const dutyTable = [
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [1, 0, 0, 1, 1, 1, 1, 1]
];

const triangleTable = [
  15,
  14,
  13,
  12,
  11,
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15
];

const noiseTable = [
  4,
  8,
  16,
  32,
  64,
  96,
  128,
  160,
  202,
  254,
  380,
  508,
  762,
  1016,
  2034,
  4068
];

const dmcTable = [
  214,
  190,
  170,
  160,
  143,
  127,
  113,
  107,
  95,
  80,
  71,
  64,
  53,
  42,
  36,
  27
];

const pulseTable = [];
for(let i = 0; i < 31; i++) {
  pulseTable.push(95.52 / (8128.0/i + 100));
}
const tndTable = [];
for(let i = 0; i < 203; i++) {
  tndTable.push(163.67 / (24329.0/i + 100));
}

export class Apu {
  private _cpu: Cpu;
  private _cycles: number;
  private _sampleRate: number;
  private _channel: number;
  private _framePeriod: number;
  private _frameValue: number;
  private _frameIrq: boolean;

  private _filterChain: FilterChain;

  private _audioContext: AudioContext;
  private _masterGain: GainNode;
  private _square0: Pulse;
  private _square1: Pulse;
  private _triangle: Triangle;
  private _noise: Noise;
  private _dmc: Dmc;

  constructor() {
    this._cycles = 0;

    this._audioContext = new AudioContext();

    this._masterGain = this._audioContext.createGain();
    this._masterGain.connect(this._audioContext.destination);
    this._masterGain.gain.value = 0.5;

    this._square0 = {
      Enabled: false,
      Channel: 1,
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
    this._square1 = {
      Enabled: false,
      Channel: 2,
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

    this._dmc = {
      Cpu: null,
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

    this._filterChain = new FilterChain(this);
  }

  public setCpu(cpu: Cpu) {
    this._cpu = cpu;
    this._dmc.Cpu = cpu;
  }

  public read$addr(address: number) {
    switch (address) {
      case 0x4015:
        return this._readStatus();
      default:
        break;
    }
  }

  public write$addr(address: number, value: number) {
    switch (address) {
      case 0x4000:
        this._writePulseControl(this._square0, value);
        break;
      case 0x4001:
        this._writePulseSweep(this._square0, value);
        break;
      case 0x4002:
        this._writePulseTimerLow(this._square0, value);
        break;
      case 0x4003:
        this._writePulseTimerHigh(this._square0, value);
        break;
      case 0x4004:
        this._writePulseControl(this._square1, value);
        break;
      case 0x4005:
        this._writePulseSweep(this._square1, value);
        break;
      case 0x4006:
        this._writePulseTimerLow(this._square1, value);
        break;
      case 0x4007:
        this._writePulseTimerHigh(this._square1, value);
        break;
      case 0x4008:
        this._writeTriangleControl(value);
        break;
      case 0x4009:
        // Intentionally blank :)
        break;
      case 0x400a:
        this._writeTriangleTimerLow(value);
        break;
      case 0x400b:
        this._writeTriangleTimerHigh(value);
        break;
      case 0x400c:
        this._writeNoiseControl(value);
        break;
      case 0x400d:
        // Intentionally blank :)
        break;
      case 0x400e:
        this._writeNoisePeriod(value);
        break;
      case 0x400f:
        this._writeNoiseLength(value);
        break;
      case 0x4010:
        this._writeDmcControl(value);
        break;
      case 0x4011:
        this._writeDmcValue(value);
        break;
      case 0x4012:
        this._writeDmcAddress(value);
        break;
      case 0x4013:
        this._writeDmcLength(value);
        break;
      case 0x4015:
        this._writeControl(value);
        break;
      case 0x4017:
        this._writeFrameCounter(value);
        break;
      default:
        break;
    }
  }

  public step() {
    let cycle1 = this._cycles;
    this._cycles++;
    let cycle2 = this._cycles;

    this._stepTimer();

    const f1 = cycle1 / frameCounterRate;
    const f2 = cycle2 / frameCounterRate;

    if(f1 !== f2) {
      this._stepFrameCounter();
    }

    const s1 = cycle1 / this._sampleRate;
    const s2 = cycle2 / this._sampleRate;
    if(s1 !== s2) {
      this.sendSample();
    }
  }

  private _readStatus(): number {
    let result = 0;

    if (this._square0.LengthValue > 0) {
      result |= 1;
    }
    if (this._square1.LengthValue > 0) {
      result |= 2;
    }
    if (this._triangle.LengthValue > 0) {
      result |= 4;
    }
    if (this._noise.LengthValue > 0) {
      result |= 8;
    }
    if (this._dmc.CurrentLength > 0) {
      result |= 16;
    }
    return result & 0xff;
  }

  private _writeControl(value: number) {
    const bValue = value & 0xff;

    this._square0.Enabled = (bValue & 1) === 1;
    this._square1.Enabled = (bValue & 2) === 2;
    this._triangle.Enabled = (bValue & 4) === 4;
    this._noise.Enabled = (bValue & 8) === 8;
    this._dmc.Enabled = (bValue & 16) === 16;

    if (!this._square0.Enabled) {
      this._square0.LengthValue = 0;
    }
    if (!this._square1.Enabled) {
      this._square1.LengthValue = 0;
    }
    if (!this._triangle.Enabled) {
      this._triangle.LengthValue = 0;
    }
    if (!this._noise.Enabled) {
      this._noise.LengthValue = 0;
    }
    if (!this._dmc.Enabled) {
      this._dmc.CurrentLength = 0;
    } else {
      if (this._dmc.CurrentLength === 0) {
        this._restartDmc();
      }
    }
  }

  public sendSample() {
    const output = this._filterChain.step(this.output());
    this._channel = output;
  }

  public output() {
    const p1 = this._outputPulse(this._square0);
    const p2 = this._outputPulse(this._square1);
    const t = this._outputTriangle();
    const n = this._outputNoise();
    const d = this._outputDmc();

    const pulseOut = pulseTable[p1 + p2];
    const tndOut = tndTable[3*t+2*n+d];
    return pulseOut + tndOut;
  }
  
  private _stepFrameCounter() {
    if(this._framePeriod === 4) {
      this._frameValue = (this._frameValue + 1 ) % 4;
      if(this._frameValue === 0 || this._frameValue === 2) {
        this._stepEnvelope();
      } else if(this._frameValue === 1) {
        this._stepEnvelope();
        this._stepSweep();
        this._stepLength();
      } else if(this._frameValue === 3) {
        this._stepEnvelope();
        this._stepSweep();
        this._stepLength();
        this._fireIrq();
      }
    } else if(this._framePeriod === 5) {
      this._frameValue = (this._frameValue + 1 )  % 5;
      if(this._frameValue === 0 || this._frameValue === 2) { 
        this._stepEnvelope();
      } else if(this._frameValue === 1 || this._frameValue === 3) {
        this._stepEnvelope();
        this._stepSweep();
        this._stepLength();
      }
    }
  }

  private _stepTimer() {
    if(this._cycles % 2 === 0) {
      this._stepTimerPulse(this._square0);
      this._stepTimerPulse(this._square1);
      this._stepTimerNoise();
      this._stepTimerDmc();
    }
    this._stepTimerTriangle();
  }

  private _stepEnvelope() {
    this._stepEnvelopePulse(this._square0);
    this._stepEnvelopePulse(this._square1);
    this._stepCounterTriangle();
    this._stepEnvelopeNoise();
  }

  private _stepSweep() {
    this._stepSweepPulse(this._square0);
    this._stepSweepPulse(this._square1);
  }

  private _stepLength() {
    this._stepLengthPulse(this._square0);
    this._stepLengthPulse(this._square1);
    this._stepLengthTriangle();
    this._stepLengthNoise();
  }

  private _fireIrq() {
    if(this._frameIrq) {
      this._cpu.requestInterrupt(InterruptRequestType.IRQ);
    }
  }

  private _writeFrameCounter(value: number) {
    const bValue = value & 0xff;

    this._framePeriod = 4 + ((bValue >>> 7) & 1);
    this._frameIrq = ((bValue >>> 6) & 1) === 0;
    if (this._framePeriod === 5) {
      this._stepEnvelope();
      this._stepSweep();
      this._stepLength();
    }
  }

  private _writePulseControl(p: Pulse, value: number) {
    const bValue = value & 0xff;

    p.DutyMode = (bValue >>> 6) & 3;
    p.LengthEnabled = ((bValue >>> 5) & 1) === 0;
    p.EnvelopeLoop = ((bValue >>> 5) & 1) === 0;
    p.EnvelopeEnabled = ((bValue >>> 4) & 1) === 0;
    p.EnvelopePeriod = bValue & 15;
    p.ConstantVolume = bValue & 15;
    p.EnvelopeStart = true;
  }

  private _writePulseSweep(p: Pulse, value: number) {
    const bValue = value & 0xff;

    p.SweepEnabled = ((bValue >>> 7) & 1) === 1;
    p.SweepPeriod = ((bValue >>> 4) & 7) + 1;
    p.SweepNegate = ((bValue >>> 3) & 1) === 1;
    p.SweepShift = value & 7;
    p.SweepReload = true;
  }

  private _writePulseTimerLow(p: Pulse, value: number) {
    const bValue = value & 0xff;

    p.TimerPeriod = (p.TimerPeriod & 0xff00) | bValue;
  }

  private _writePulseTimerHigh(p: Pulse, value: number) {
    const bValue = value & 0xff;

    p.LengthValue = lengthTable[bValue >>> 3];
    p.TimerPeriod = (p.TimerPeriod & 0x00ff) | (bValue << 8);
    p.EnvelopeStart = true;
    p.DutyValue = 0;
  }

  private _stepTimerPulse(p: Pulse) {
    if (p.TimerValue === 0) {
      p.TimerValue = p.TimerPeriod;
      p.DutyValue = (p.DutyValue + 1) % 8;
    } else {
      p.TimerValue--;
    }
  }

  private _stepEnvelopePulse(p: Pulse) {
    if (p.EnvelopeStart) {
      p.EnvelopeVolume = 14;
      p.EnvelopeValue = p.EnvelopePeriod;
      p.EnvelopeStart = false;
    } else if (p.EnvelopeValue > 0) {
      p.EnvelopeValue--;
    } else {
      if (p.EnvelopeVolume > 0) {
        p.EnvelopeVolume--;
      } else if (p.EnvelopeLoop) {
        p.EnvelopeVolume = 14;
      }
      p.EnvelopeValue = p.EnvelopePeriod;
    }
  }

  private _stepSweepPulse(p: Pulse) {
    if (p.SweepReload) {
      if (p.SweepEnabled && p.SweepValue === 0) {
        this._sweepPulse(p);
      }
      p.SweepValue = p.SweepPeriod;
      p.SweepReload = false;
    } else if (p.SweepValue > 0) {
      p.SweepValue--;
    } else {
      if (p.SweepEnabled) {
        this._sweepPulse(p);
      }
      p.SweepValue = p.SweepPeriod;
    }
  }

  private _stepLengthPulse(p: Pulse) {
    if (p.LengthEnabled && p.LengthValue > 0) {
      p.LengthValue--;
    }
  }

  private _sweepPulse(p: Pulse) {
    const delta = p.TimerPeriod >>> p.SweepShift;
    if (p.SweepNegate) {
      p.TimerPeriod -= delta;
      if (p.Channel === 1) {
        p.TimerPeriod--;
      }
    } else {
      p.TimerPeriod += delta;
    }
  }

  private _outputPulse(p: Pulse) {
    if (!p.Enabled) {
      return 0;
    }
    if (p.LengthValue === 0) {
      return 0;
    }

    if (dutyTable[p.DutyMode][p.DutyValue] === 0) {
      return 0;
    }

    if (p.TimerPeriod < 8 || p.TimerPeriod > 0x7ff) {
      return 0;
    }

    if (p.EnvelopeEnabled) {
      return p.EnvelopeVolume;
    } else {
      return p.ConstantVolume;
    }
  }

  private _writeTriangleControl(value: number) {
    const bValue = value & 0xff;

    this._triangle.LengthEnabled = ((bValue >>> 7) & 1) === 0;
    this._triangle.CounterPeriod = value & 0x7f;
  }

  private _writeTriangleTimerLow(value: number) {
    const bValue = value & 0xff;

    this._triangle.TimerPeriod = (this._triangle.TimerPeriod & 0xff00) | bValue;
  }

  private _writeTriangleTimerHigh(value: number) {
    const bValue = value & 0xff;

    this._triangle.LengthValue = lengthTable[bValue >>> 3];
    this._triangle.TimerPeriod =
      (this._triangle.TimerPeriod & 0x00ff) | (bValue << 8);
    this._triangle.TimerValue = this._triangle.TimerPeriod;
    this._triangle.CounterReload = true;
  }

  private _stepTimerTriangle() {
    if (this._triangle.TimerValue === 0) {
      this._triangle.TimerValue = this._triangle.TimerPeriod;
      if (this._triangle.LengthValue > 0 && this._triangle.CounterValue > 0) {
        this._triangle.DutyValue = (this._triangle.DutyValue + 1) % 32;
      }
    } else {
      this._triangle.TimerValue--;
    }
  }

  private _stepLengthTriangle() {
    if (this._triangle.LengthEnabled && this._triangle.LengthValue > 0) {
      this._triangle.LengthValue--;
    }
  }

  private _stepCounterTriangle() {
    if (this._triangle.CounterReload) {
      this._triangle.CounterValue = this._triangle.CounterPeriod;
    } else if (this._triangle.CounterValue > 0) {
      this._triangle.CounterValue--;
    }
    if (this._triangle.LengthEnabled) {
      this._triangle.CounterReload = false;
    }
  }

  private _outputTriangle() {
    if (!this._triangle.Enabled) {
      return 0;
    }
    if (this._triangle.LengthValue === 0) {
      return 0;
    }
    if (this._triangle.CounterValue === 0) {
      return 0;
    }

    return triangleTable[this._triangle.DutyValue];
  }

  private _writeNoiseControl(value: number) {
    const bValue = value & 0xff;

    this._noise.LengthEnabled = ((bValue >>> 5) & 1) === 0;
    this._noise.EnvelopeLoop = ((bValue >>> 5) & 1) === 1;
    this._noise.EnvelopeEnabled = ((bValue >>> 4) & 1) === 0;
    this._noise.EnvelopePeriod = bValue & 15;
    this._noise.ConstantVolume = bValue & 15;
    this._noise.EnvelopeStart = true;
  }

  private _writeNoisePeriod(value: number) {
    const bValue = value & 0xff;

    this._noise.Mode = (bValue & 0x80) === 0x80;
    this._noise.TimerPeriod = noiseTable[bValue & 0x0f];
  }

  private _writeNoiseLength(value: number) {
    const bValue = value & 0xff;

    this._noise.LengthValue = lengthTable[bValue >>> 3];
    this._noise.EnvelopeStart = true;
  }

  private _stepTimerNoise() {
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

  private _stepEnvelopeNoise() {
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

  private _stepLengthNoise() {
    if (this._noise.LengthEnabled && this._noise.LengthValue > 0) {
      this._noise.LengthValue--;
    }
  }

  private _outputNoise() {
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

  private _writeDmcControl(value: number) {
    const bValue = value & 0xff;

    this._dmc.Irq = (bValue & 0x80) === 0x80;
    this._dmc.Loop = (bValue & 0x40) === 0x40;
    this._dmc.TickPeriod = dmcTable[bValue & 0x0f];
  }

  private _writeDmcValue(value: number) {
    const bValue = value & 0xff;

    this._dmc.Value = bValue & 0x7f;
  }

  private _writeDmcAddress(value: number) {
    const bValue = value & 0xff;

    this._dmc.SampleAddress = 0xc000 | (bValue << 6);
  }

  private _writeDmcLength(value: number) {
    const bValue = value & 0xff;

    this._dmc.SampleLength = (bValue << 4) | 1;
  }

  private _restartDmc() {
    this._dmc.CurrentAddress = this._dmc.SampleAddress;
    this._dmc.CurrentLength = this._dmc.SampleLength;
  }

  private _stepTimerDmc() {
    if (!this._dmc.Enabled) {
      return;
    }

    this._stepReaderDmc();
    if (this._dmc.TickValue === 0) {
      this._dmc.TickValue = this._dmc.TickPeriod;
      this._stepShifterDmc();
    } else {
      this._dmc.TickValue--;
    }
  }

  private _stepReaderDmc() {
    if (this._dmc.CurrentLength > 0 && this._dmc.BitCount === 0) {
      this._dmc.Cpu.setStallCycles(this._dmc.Cpu.stallCycles() + 4);
      this._dmc.ShiftRegister = this._dmc.Cpu.memRead(this._dmc.CurrentAddress);
      this._dmc.BitCount = 8;
      this._dmc.CurrentAddress++;
      if (this._dmc.CurrentAddress === 0) {
        this._dmc.CurrentAddress = 0x8000;
      }

      this._dmc.CurrentLength--;
      if (this._dmc.CurrentLength === 0 && this._dmc.Loop) {
        this._restartDmc();
      }
    }
  }

  private _stepShifterDmc() {
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

  private _outputDmc() {
    return this._dmc.Value;
  }
}

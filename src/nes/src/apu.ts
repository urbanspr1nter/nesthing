import { Cpu } from "./cpu";
import { InterruptRequestType } from "./cpu.interface";
import { FilterChain } from "./filterchain";
import { EventEmitter } from "events";
import { CpuFrequencyHz, ApuFrameCounterRate } from "./constants";
import { PulseWave } from "./apu.pulsewave";
import { TriangleWave } from "./apu.trianglewave";
import { NoiseWave } from "./apu.noisewave";
import { DmcSample } from "./apu.dmcsample";

const pulseTable = [];
const tndTable = [];

export class Apu {
  private _cpu: Cpu;
  private _cycles: number;
  private _sampleRate: number;
  private _framePeriod: number;
  private _frameValue: number;
  private _frameIrq: boolean;
  private _sampleEmitter: EventEmitter;

  private _filterChain: FilterChain;

  private _square0: PulseWave;
  private _square1: PulseWave;
  private _triangle: TriangleWave;
  private _noise: NoiseWave;
  private _dmc: DmcSample;

  constructor(emitter: EventEmitter) {
    for (let i = 0; i < 31; i++) {
      pulseTable.push(95.52 / (8128.0 / i + 100));
    }
    for (let i = 0; i < 203; i++) {
      tndTable.push(163.67 / (24329.0 / i + 100));
    }

    this._cycles = 0;

    this._square0 = new PulseWave(1);
    this._square1 = new PulseWave(2);
    this._triangle = new TriangleWave();
    this._noise = new NoiseWave();

    this._filterChain = new FilterChain();

    this._sampleEmitter = emitter;
  }

  public setCpu(cpu: Cpu) {
    this._cpu = cpu;
    this._dmc = new DmcSample(cpu);
  }

  public read$addr(address: number) {
    switch (address) {
      case 0x4015:
        return this._readStatus();
      default:
        break;
    }

    return 0;
  }

  public write$addr(address: number, value: number) {
    switch (address) {
      case 0x4000:
        this._square0.writeControl(value);
        break;
      case 0x4001:
        this._square0.writeSweep(value);
        break;
      case 0x4002:
        this._square0.writeTimerLow(value);
        break;
      case 0x4003:
        this._square0.writeTimerHigh(value);
        break;
      case 0x4004:
        this._square1.writeControl(value);
        break;
      case 0x4005:
        this._square1.writeSweep(value);
        break;
      case 0x4006:
        this._square1.writeTimerLow(value);
        break;
      case 0x4007:
        this._square1.writeTimerHigh(value);
        break;
      case 0x4008:
        this._triangle.writeControl(value);
        break;
      case 0x4009:
        // Intentionally blank :)
        break;
      case 0x400a:
        this._triangle.writeTimerLow(value);
        break;
      case 0x400b:
        this._triangle.writeTimerHigh(value);
        break;
      case 0x400c:
        this._noise.writeControl(value);
        break;
      case 0x400d:
        // Intentionally blank :)
        break;
      case 0x400e:
        this._noise.writePeriod(value);
        break;
      case 0x400f:
        this._noise.writeLength(value);
        break;
      case 0x4010:
        this._dmc.writeControl(value);
        break;
      case 0x4011:
        this._dmc.writeValue(value);
        break;
      case 0x4012:
        this._dmc.writeAddress(value);
        break;
      case 0x4013:
        this._dmc.writeLength(value);
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

  public setAudioSampleRate(sampleRate: number) {
    this._sampleRate = CpuFrequencyHz / sampleRate;

    this._filterChain.addFilters(
      this._filterChain.highPassFilter(sampleRate, 90)
    );
    this._filterChain.addFilters(
      this._filterChain.highPassFilter(sampleRate, 440)
    );
    this._filterChain.addFilters(
      this._filterChain.lowPassFilter(sampleRate, 14000)
    );
  }

  public step() {
    const cycle1 = this._cycles;
    this._cycles++;
    const cycle2 = this._cycles;

    this._stepTimer();

    const f1 = Math.trunc(cycle1 / ApuFrameCounterRate);
    const f2 = Math.trunc(cycle2 / ApuFrameCounterRate);

    if (f1 !== f2) {
      this._stepFrameCounter();
    }

    const s1 = Math.trunc(cycle1 / this._sampleRate);
    const s2 = Math.trunc(cycle2 / this._sampleRate);
    if (s1 !== s2) {
      this._sendSample();
    }
  }

  private _readStatus(): number {
    let result = 0;

    if (this._square0.pulse.LengthValue > 0) {
      result |= 1;
    }
    if (this._square1.pulse.LengthValue > 0) {
      result |= 2;
    }
    if (this._triangle.triangle.LengthValue > 0) {
      result |= 4;
    }
    if (this._noise.noise.LengthValue > 0) {
      result |= 8;
    }
    if (this._dmc.dmc.CurrentLength > 0) {
      result |= 16;
    }
    return result & 0xff;
  }

  private _writeControl(value: number) {
    const bValue = value & 0xff;

    this._square0.pulse.Enabled = (bValue & 1) === 1;
    this._square1.pulse.Enabled = (bValue & 2) === 2;
    this._triangle.triangle.Enabled = (bValue & 4) === 4;
    this._noise.noise.Enabled = (bValue & 8) === 8;
    this._dmc.dmc.Enabled = (bValue & 16) === 16;

    if (!this._square0.pulse.Enabled) {
      this._square0.pulse.LengthValue = 0;
    }
    if (!this._square1.pulse.Enabled) {
      this._square1.pulse.LengthValue = 0;
    }
    if (!this._triangle.triangle.Enabled) {
      this._triangle.triangle.LengthValue = 0;
    }
    if (!this._noise.noise.Enabled) {
      this._noise.noise.LengthValue = 0;
    }
    if (!this._dmc.dmc.Enabled) {
      this._dmc.dmc.CurrentLength = 0;
    } else {
      if (this._dmc.dmc.CurrentLength === 0) {
        this._dmc.restart();
      }
    }
  }

  private _sendSample() {
    const output = this._filterChain.step(this._output());
    this._sampleEmitter.emit("onsamplereceive", output);
  }

  private _output() {
    const p1 = this._square0.output();
    const p2 = this._square1.output();
    const t = this._triangle.output();
    const n = this._noise.output();
    const d = this._dmc.output();

    const pulseOut = pulseTable[p1 + p2];
    const tndOut = tndTable[3 * t + 2 * n + d];
    return pulseOut + tndOut;
  }

  private _stepFrameCounter() {
    if (this._framePeriod === 4) {
      this._frameValue = (this._frameValue + 1) % 4;
      if (this._frameValue === 0 || this._frameValue === 2) {
        this._stepEnvelope();
      } else if (this._frameValue === 1) {
        this._stepEnvelope();
        this._stepSweep();
        this._stepLength();
      } else if (this._frameValue === 3) {
        this._stepEnvelope();
        this._stepSweep();
        this._stepLength();
        this._fireIrq();
      }
    } else if (this._framePeriod === 5) {
      this._frameValue = (this._frameValue + 1) % 5;
      if (this._frameValue === 0 || this._frameValue === 2) {
        this._stepEnvelope();
      } else if (this._frameValue === 1 || this._frameValue === 3) {
        this._stepEnvelope();
        this._stepSweep();
        this._stepLength();
      }
    }
  }

  private _stepTimer() {
    if (this._cycles % 2 === 0) {
      this._square0.stepTimer();
      this._square1.stepTimer();
      this._noise.stepTimer();
      this._dmc.stepTimer();
    }
    this._triangle.stepTimer();
  }

  private _stepEnvelope() {
    this._square0.stepEnvelope();
    this._square1.stepEnvelope();
    this._triangle.stepCounter();
    this._noise.stepEnvelope();
  }

  private _stepSweep() {
    this._square0.stepSweep();
    this._square1.stepSweep();
  }

  private _stepLength() {
    this._square0.stepLength();
    this._square1.stepLength();
    this._triangle.stepLength();
    this._noise.stepLength();
  }

  private _fireIrq() {
    if (this._frameIrq) {
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
}

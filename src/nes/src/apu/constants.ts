import { CpuFrequencyHz } from "../cpu/constants";
import { Cpu } from "../cpu/cpu";

export const AUDIO_BUFFER_LENGTH = 4096;
export const AUDIO_SAMPLE_RATE = 44100;

export const ApuFrameCounterRate = CpuFrequencyHz / 240.0;
export const ApuLengthTable = [
    10, 254, 20, 2, 40, 4, 80, 6, 160, 8, 60, 10, 14, 12, 26, 14,
    12, 16, 24, 18, 48, 20, 96, 22, 192, 24, 72, 26, 16, 28, 32, 30
];
export const ApuDutyTable = [
    [0, 1, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [1, 0, 0, 1, 1, 1, 1, 1]
];
export const ApuTriangleTable = [
    15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
];
export const ApuNoiseTable = [
    4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068
];
export const ApuDmcTable = [
    214, 190, 170, 160, 143, 127, 113, 107, 95, 80, 71, 64, 53, 42, 36, 27
];

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

export interface Dmc {
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

export interface ApuState {
  cycles: number;
  sampleRate: number;
  framePeriod: number;
  frameValue: number;
  frameIrq: boolean;
  square0: Pulse;
  square1: Pulse;
  triangle: Triangle;
  noise: Noise;
  dmc: Dmc;
}
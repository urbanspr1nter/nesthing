import { InterruptRequestType, CycleContext, CpuRegisters } from "./cpu.interface";

/** CPU Constants */
export const CpuFrequencyHz = 1789773;
export const CpuCyclesInFrame = 29780;

export enum MirrorMode {
  MirrorHorizontal,
  MirrorVertical,
  MirrorSingle0,
  MirrorSingle1,
  MirrorFour
}

export interface CpuState {
  registers: CpuRegisters;
  currentCycles: number;
  stallCycles: number;
  interrupt: InterruptRequestType;
  context: CycleContext;
}
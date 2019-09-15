import { Cpu } from "./cpu";
import { Memory } from "../memory";
import { InterruptRequestType, AddressingModes } from "./cpu.interface";
import { CpuState } from "./constants";

const mockMemory = ({
  save: jest.fn(),
  load: jest.fn(),
  set: jest.fn(),
  get: jest.fn()
} as unknown) as Memory;

let cpu: Cpu;

describe("cput.test", () => {
  beforeEach(() => {
    cpu = new Cpu(mockMemory);
  });

  it("should be initialized correctly", () => {
    expect(cpu.memory).toBe(mockMemory);
    expect(cpu.stallCycles).toBe(0);
    expect(cpu.currentCycles).toBe(0);
  });

  it("should get memory", () => {
    expect(cpu.memory).toBe(mockMemory);
  });

  it("should power up", () => {
    cpu.powerUp();

    // Set 0x800 locations and call stack push 3 times.
    expect(mockMemory.set).toHaveBeenCalledTimes(0x800 + 3);
    expect(cpu.P).toBe(0x24);

    // Stack push called 3 times
    expect(cpu.SP).toBe(0x01fa);
  });

  it("should set stall cyles", () => {
    cpu.stallCycles = 512;
    expect(cpu.stallCycles).toBe(512);
  });

  it("should get current cycles", () => {
    mockMemory.get = jest.fn().mockImplementation(addr => {
      if (addr === 0x0) {
        return 0x69;
      }
      if (addr === 0x1) {
        return 0x3;
      }
    });

    cpu.PC = 0x0;
    const cycles = cpu.step();

    expect(cycles).toBe(2);
    expect(cpu["_registers"].A).toBe(3);
    expect(cpu.currentCycles).toBe(2);
  });

  it("should load CPU state", () => {
    const state: CpuState = {
      registers: {
        X: 0x12,
        Y: 0x34,
        A: 0x45,
        P: 0x67,
        SP: 0x01ee,
        PC: 0x8900
      },
      currentCycles: 9998,
      stallCycles: 1,
      interrupt: InterruptRequestType.None,
      context: {
        PC: 0x8900,
        Mode: AddressingModes.Immediate,
        Address: 12
      }
    };

    cpu.load(state);

    expect(cpu.registers).toEqual(state.registers);
    expect(cpu.currentCycles).toEqual(state.currentCycles);
    expect(cpu.stallCycles).toEqual(state.stallCycles);
  });

  it("should save CPU state", () => {
    cpu.X = 0x56;
    cpu.Y = 0xff;
    cpu.A = 0xde;

    cpu.stallCycles = 0x123;
    cpu["_currentCycles"] = 0x8888;

    const state = cpu.save();

    const { X, Y, A } = state.registers;
    expect({ X, Y, A }).toEqual({ X: 0x56, Y: 0xff, A: 0xde });
    expect(cpu.stallCycles).toEqual(0x123);
    expect(cpu.currentCycles).toEqual(0x8888);
  });
});

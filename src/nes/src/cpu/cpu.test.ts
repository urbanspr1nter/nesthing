import { Cpu } from "./cpu";
import { Memory } from "../memory";
import { InterruptRequestType, AddressingModes } from "./cpu.interface";
import { CpuState } from "./constants";
import { isOverflow, isCarry } from "./cpu.helpers";

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

    jest.clearAllMocks();
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

  it("should set the proper interrupt type", () => {
    cpu.requestInterrupt(InterruptRequestType.NMI);
    expect(cpu.interruptType).toBe(InterruptRequestType.NMI);

    cpu.requestInterrupt(InterruptRequestType.IRQ);
    expect(cpu.interruptType).toBe(InterruptRequestType.IRQ);

    cpu.requestInterrupt(InterruptRequestType.Reset);
    expect(cpu.interruptType).toBe(InterruptRequestType.Reset);
  });

  it("should not operate on dcp opcodes", () => {
    jest.spyOn(cpu, "dcp");
    const dcpOpcodes = [0xc3, 0xc7, 0xcf, 0xd3, 0xd7, 0xdb, 0xdf];
    for (const opcode of dcpOpcodes) {
      mockMemory.get = jest.fn().mockImplementation(() => opcode);
      cpu.step();
    }
    expect(cpu.dcp).toHaveBeenCalledTimes(dcpOpcodes.length);
  });

  it("should not operate on ign opcodes", () => {
    jest.spyOn(cpu, "ign");
    const ignOpcodes = [
      0x0c,
      0x1c,
      0x3c,
      0x5c,
      0x7c,
      0xdc,
      0xfc,
      0x04,
      0x44,
      0x64,
      0x14,
      0x34,
      0x54,
      0x74,
      0xd4,
      0xf4
    ];
    for (const opcode of ignOpcodes) {
      mockMemory.get = jest.fn().mockImplementation(() => opcode);
      cpu.step();
    }
    expect(cpu.ign).toHaveBeenCalledTimes(ignOpcodes.length);
  });

  it("should not operate on isb opcodes", () => {
    jest.spyOn(cpu, "isb");
    const isbOpcodes = [0xe3, 0xe7, 0xef, 0xf3, 0xf7, 0xfb, 0xff];
    for (const opcode of isbOpcodes) {
      mockMemory.get = jest.fn().mockImplementation(() => opcode);
      cpu.step();
    }
    expect(cpu.isb).toHaveBeenCalledTimes(isbOpcodes.length);
  });

  it("should not operate on lax opcodes", () => {
    jest.spyOn(cpu, "lax");
    const laxOpcodes = [0xa3, 0xa7, 0xaf, 0xb3, 0xb7, 0xbf];
    for (const opcode of laxOpcodes) {
      mockMemory.get = jest.fn().mockImplementation(() => opcode);
      cpu.step();
    }
    expect(cpu.lax).toHaveBeenCalledTimes(laxOpcodes.length);
  });

  it("should not operate on rla opcodes", () => {
    jest.spyOn(cpu, "rla");
    const rlaOpcodes = [0x23, 0x27, 0x2f, 0x33, 0x37, 0x3b, 0x3f];
    for (const opcode of rlaOpcodes) {
      mockMemory.get = jest.fn().mockImplementation(() => opcode);
      cpu.step();
    }
    expect(cpu.rla).toHaveBeenCalledTimes(rlaOpcodes.length);
  });

  it("should not operate on rra opcodes", () => {
    jest.spyOn(cpu, "rra");
    const rraOpcodes = [0x63, 0x67, 0x6f, 0x73, 0x77, 0x7b, 0x7f];
    for (const opcode of rraOpcodes) {
      mockMemory.get = jest.fn().mockImplementation(() => opcode);
      cpu.step();
    }
    expect(cpu.rra).toHaveBeenCalledTimes(rraOpcodes.length);
  });

  it("should not operate on skb opcodes", () => {
    jest.spyOn(cpu, "skb");
    const skbOpcodes = [0x80, 0x82, 0x89, 0xc2, 0xe2];
    for (const opcode of skbOpcodes) {
      mockMemory.get = jest.fn().mockImplementation(() => opcode);
      cpu.step();
    }
    expect(cpu.skb).toHaveBeenCalledTimes(skbOpcodes.length);
  });
  it("should not operate on sax opcodes", () => {
    jest.spyOn(cpu, "sax");
    const saxOpcodes = [0x83, 0x87, 0x8f, 0x97];
    for (const opcode of saxOpcodes) {
      mockMemory.get = jest.fn().mockImplementation(() => opcode);
      cpu.step();
    }
    expect(cpu.sax).toHaveBeenCalledTimes(saxOpcodes.length);
  });

  it("should not operate on slo opcodes", () => {
    jest.spyOn(cpu, "slo");
    const sloOpcodes = [0x03, 0x07, 0x0f, 0x13, 0x17, 0x1b, 0x1f];
    for (const opcode of sloOpcodes) {
      mockMemory.get = jest.fn().mockImplementation(() => opcode);
      cpu.step();
    }
    expect(cpu.slo).toHaveBeenCalledTimes(sloOpcodes.length);
  });

  it("should not operate on sre opcdoes", () => {
    jest.spyOn(cpu, "sre");
    const sreOpcodes = [0x43, 0x47, 0x4f, 0x53, 0x57, 0x5b, 0x5f];
    for (const opcode of sreOpcodes) {
      mockMemory.get = jest.fn().mockImplementation(() => opcode);
      cpu.step();
    }
    expect(cpu.sre).toHaveBeenCalledTimes(sreOpcodes.length);
  });
});

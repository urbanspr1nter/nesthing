import { read16Bug, read16 } from "./cpu.helpers";

describe("cpu.helpers tests", () => {
  it("should simulate wraparound bug - wrap around low byte without incrementing high byte", () => {
    const mockCpu = {
      memRead: jest.fn().mockImplementation((param: number) => {
        const mockMemory = { 0x11ff: 0, 0x1200: 1, 0x1100: 2 };

        return mockMemory[param];
      })
    };

    const address = 0x11ff;
    const result = read16Bug(mockCpu as any, address);

    expect(mockCpu.memRead).toHaveBeenNthCalledWith(1, 0x11ff);
    expect(mockCpu.memRead).toHaveBeenNthCalledWith(2, 0x1100);
    expect(result).toBe(0x0200);
  });

  it("should read 2 bytes from memory to form an effective address", () => {
    const mockCpu = {
      memRead: jest.fn().mockImplementation((param: number) => {
        const mockMemory = {
          0x1000: 0,
          0x1001: 2,
          0x1002: 3,
          0x10ff: 4,
          0x1100: 5
        };
        return mockMemory[param];
      })
    };

    let address = 0x1000;
    let result = read16(mockCpu as any, address);
    expect(result).toBe(0x0200);

    address = 0x10ff;
    result = read16(mockCpu as any, address);
    expect(result).toBe(0x0504);
  });
});

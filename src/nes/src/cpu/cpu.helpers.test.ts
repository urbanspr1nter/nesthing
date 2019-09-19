import { read16Bug, read16, isCarry, isOverflow } from "./cpu.helpers";

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

  it("should carry on addition when carry not set", () => {
    const first = 0xfe;
    const second = 0x02;
    const carry = 0;

    expect(isCarry(first, second, carry, true)).toBe(true);
  });

  it("should carry on addition when carry is set", () => {
    const first = 0xfe;
    const second = 0x1;
    const carry = 1;

    expect(isCarry(first, second, carry, true)).toBe(true);
  });

  it("should not carry on addition when carry not set", () => {
    const first = 0xfe;
    const second = 0x1;
    const carry = 0;

    expect(isCarry(first, second, carry, true)).toBe(false);
  });

  it("should not carry on addition when carry is set", () => {
    const first = 0xfd;
    const second = 0x1;
    const carry = 0x1;

    expect(isCarry(first, second, carry, true)).toBe(false);
  });

  it("should carry on subtraction when carry not set", () => {
    const first = 0xf0;
    const second = 0xef;
    const carry = 0x0;

    expect(isCarry(first, second, carry, false)).toBe(true);
  });

  it("should carry on subtraction when carry is set", () => {
    const first = 0xf0;
    const second = 0xef;
    const carry = 0x1;

    expect(isCarry(first, second, carry, false)).toBe(true);
  });

  it("should carry on subtraction when carry is not set", () => {
    const first = 0xf0;
    const second = 0xf1;
    const carry = 0x0;

    expect(isCarry(first, second, carry, false)).toBe(false);
  });

  it("should carry on subtraction when carry is set", () => {
    const first = 0xf0;
    const second = 0xf0;
    const carry = 0x1;

    expect(isCarry(first, second, carry, false)).toBe(false);
  });

  it("should overflow on subtraction: pos - neg = neg", () => {
    const first = 3;
    const second = -126;
    const borrow = 0;
    const final = first - second - borrow;

    expect(isOverflow(first, second, final, false)).toBe(true);
  });

  it("should overflow on subtraction: neg - pos = pos", () => {
    const first = -3;
    const second = 127;
    const borrow = 0;
    const final = first - second - borrow;

    expect(isOverflow(first, second, final, false)).toBe(true);
  });

  it("should not overflow on subtraction: pos - pos = pos", () => {
    const first = 120;
    const second = 100;
    const borrow = 0;
    const final = first - second - borrow;

    expect(isOverflow(first, second, final, false)).toBe(false);
  });

  it("should not overflow on subtraction: neg - neg = neg", () => {
    const first = -125;
    const second = -2;
    const borrow = 0;
    const final = first - second - borrow;

    expect(isOverflow(first, second, final, false)).toBe(false);
  });

  it("should not overflow on subtraction: pos - neg = pos", () => {
    const first = 100;
    const second = -3;
    const borrow = 0;
    const final = first - second - borrow;

    expect(isOverflow(first, second, final, false)).toBe(false);
  });

  it("should not overflow on subtraction: neg - pos = neg", () => {
    const first = -100;
    const second = 3;
    const borrow = 0;
    const final = first - second - borrow;

    expect(isOverflow(first, second, final, false)).toBe(false);
  });

  it("should not overflow on subtraction: neg - neg = pos", () => {
    const first = -100;
    const second = -103;
    const borrow = 0;
    const final = first - second - borrow;

    expect(isOverflow(first, second, final, false)).toBe(false);
  });

  it("should not overflow on subtraction: pos - pos = neg", () => {
    const first = 100;
    const second = 103;
    const borrow = 0;
    const final = first - second - borrow;

    expect(isOverflow(first, second, final, false)).toBe(false);
  });

  it("should check for addition overflow", () => {
    let first = 0;

    // positive + positive = positive
    while (first < 0x80) {
      let second = 0x7f - first;
      while (second >= 0) {
        const result = first + second;
        expect(isOverflow(first, second, result, true)).toBe(false);
        second--;
      }
      first++;
    }

    // positive + negative = positive
    first = 0;
    while (first < 0x80) {
      let second = 0x80 + first;
      while (second <= 0xff) {
        const result = first + second;
        expect(isOverflow(first, second, result, true)).toBe(false);
        second++;
      }
      first++;
    }

    // negative + positive = positive
    // negative + negative = negative
    // negative + positive = negative
  });
});

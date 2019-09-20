import { Cpu } from "./cpu";

export function read16Bug(cpu: Cpu, address: number): number {
  const a = address;

  const bHigh = a & 0xff00;
  const bLow = (a + 1) & 0xff;
  const b = bHigh | bLow;

  const low = cpu.memRead(a);
  const high = cpu.memRead(b);

  const effAddress = ((high << 8) | low) & 0xffff;

  return effAddress;
}

export function read16(cpu: Cpu, address: number): number {
  const low = cpu.memRead(address);
  const high = cpu.memRead(address + 1);

  return ((high << 8) | low) & 0xffff;
}

export function isOverflowOnAdc(
  first: number,
  second: number,
  result: number
): boolean {
  return ((first ^ second) & 0x80) === 0 && ((first ^ result) & 0x80) !== 0;
}

export function isOverflowOnSbc(first: number, second: number, result: number) {
  return ((first ^ second) & 0x80) !== 0 && ((first ^ result) & 0x80) !== 0;
}

export function isCarry(
  first: number,
  second: number,
  carry: number,
  adc: boolean
) {
  const modifiedFirst = first & 0xff;
  const modifiedSecond = second & 0xff;
  const modifiedCarry = carry & 0xff;
  if (adc) {
    return modifiedFirst + modifiedSecond + modifiedCarry > 0xff;
  } else {
    return modifiedFirst - modifiedSecond - modifiedCarry >= 0;
  }
}

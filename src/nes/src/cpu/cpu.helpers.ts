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

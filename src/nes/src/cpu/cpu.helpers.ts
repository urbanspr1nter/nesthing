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

export function isOverflow(
  first: number,
  second: number,
  final: number,
  isAdc: boolean
): boolean {
  const modifiedFirst = first & 0xff;
  const modifiedSecond = second & 0xff;
  const modifiedFinal = final & 0xff;

  const sbcA =
    (modifiedFirst & 0x80) === 0 &&
    (modifiedSecond & 0x80) !== 0 &&
    (modifiedFinal & 0x80) !== 0;
  const sbcB =
    (modifiedFirst & 0x80) !== 0 &&
    (modifiedSecond & 0x80) === 0 &&
    (modifiedFinal & 0x80) === 0;

  if (isAdc) {
    if (
      ((modifiedFirst ^ modifiedSecond) & 0x80) === 0 &&
      ((modifiedFinal ^ modifiedFirst) & 0x80) !== 0
    ) {
      return true;
    }
  } else {
    if (sbcA || sbcB) {
      return true;
    }
  }

  return false;

  /*
  if (isAdc) {
    if (
      ((modifiedFirst ^ modifiedSecond) & 0x80) === 0 &&
      ((modifiedFirst ^ modifiedFinal) & 0x80) !== 0
    ) {
      return true;
    } else {
      return false;
    }
  } else {
    if (
      ((modifiedFirst ^ modifiedSecond) & 0x80) !== 0 &&
      ((modifiedFirst ^ modifiedFinal) & 0x80) !== 0
    ) {
      return true;
    } else {
      return false;
    }
  }*/
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

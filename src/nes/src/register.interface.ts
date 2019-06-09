interface Register {
  set: (value: number) => void;
  get: () => number;
}

export class ByteRegister implements Register {
  private _value: number;

  constructor(value: number) {
    this._value = value;
  }

  public set(value: number): void {
    this._value = value;

    this._adjust();
  }

  public get(): number {
    return this._value;
  }

  private _adjust(): void {
    this._value = this._value & 0xff;
  }
}

export class DoubleByteRegister implements Register {
  private _value: number;

  constructor(value: number) {
    this._value = value;
  }

  public set(value: number): void {
    this._value = value & 0xffff;
  }

  public get(): number {
    return this._value;
  }

  public add(operand: number): void {
    this._value += operand;
    this._value &= 0xffff;
  }
}

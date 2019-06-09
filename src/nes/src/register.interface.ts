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

  private _adjust(): number {
    this._value = this._value & 0xff;

    return this._value;
  }
}

export class DoubleByteRegister implements Register {
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

  public add(operand: number): number {
    this._value += operand;

    return this._adjust();
  }

  public subtract(operand: number): number {
    this._value -= operand;

    return this._adjust();
  }

  private _adjust(): number {
    this._value = this._value & 0xffff;

    return this._value;
  }
}

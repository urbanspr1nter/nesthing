const MaxMemoryAddress = 0x3fff;

export class PpuMemory {
  private _memory: number[];

  constructor() {
    this._memory = [];

    // Blank out
    for (let i = 0x0000; i <= MaxMemoryAddress; i++) {
      this._memory[i] = 0xff;
    }
  }

  public bits(): number[] {
    return this._memory;
  }

  public set = (address: number, value: number): void => {
    const decodedAddress = address % 0x4000;
    this._memory[decodedAddress] = value & 0xff;
  };

  public get = (address: number) => {
    const decodedAddress = address % 0x4000;
    return this._memory[decodedAddress] & 0xff;
  };
}

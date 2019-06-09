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

  public snapNt() {
      let data = "";
      for(let address = 0x2000; address <= 0x23BF; address++) {
          if(address % 0x20 === 0) {
              data += "&#13;";
          }

          let byte = this._memory[address].toString(16).toUpperCase();
          if(byte.length < 2) {
              byte = `0${byte}`;
          }
          data += `${byte} `;
      }

      return data;
  }
}

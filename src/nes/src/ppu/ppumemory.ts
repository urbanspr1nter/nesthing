import { IMapper } from "../mapper";

export class PpuMemory {
  private _mapper: IMapper;
  private _memory: number[];

  constructor(mapper: IMapper) {
    this._memory = [];
    this._mapper = mapper;
  }

  public bits(): number[] {
    return this._memory;
  }

  public set(address: number, value: number) {
    const decodedAddress = address % 0x4000;
    if(decodedAddress < 0x2000) {
      this._mapper.write(decodedAddress, value);
    } else {
      this._memory[decodedAddress] = value & 0xff;
    }
  };

  public get(address: number) {
    const decodedAddress = address % 0x4000;
    if(decodedAddress < 0x2000) {
      return this._mapper.read(decodedAddress);
    }
    return this._memory[decodedAddress] & 0xff;
  };
}

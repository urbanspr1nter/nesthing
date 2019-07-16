import { IMapper } from "../mapper";
import { MirrorMode } from "../constants";

const MirrorLookup = [
  [0, 0, 1, 1],
  [0, 1, 0, 1],
  [0, 0, 0, 0],
  [1, 1, 1, 1],
  [0, 1, 2, 3]
];
export class PpuMemory {
  private _mapper: IMapper;
  private _memory: number[];
  private _nameTableData: number[];

  constructor(mapper: IMapper) {
    this._memory = [];
    this._mapper = mapper;

    this._nameTableData = [];
    for(let i = 0; i < 2048; i++) {
      this._nameTableData[i] = 0;
    }
  }

  public bits(): number[] {
    return this._memory;
  }

  public set(address: number, value: number) {
    const decodedAddress = address % 0x4000;
    if(decodedAddress < 0x2000) {
      this._mapper.write(decodedAddress, value);
    } else if(decodedAddress < 0x3f00) {
      const mode = this._mapper.cartridge.mirror;
      const mirroredAddress = this._getMirrorAddress(mode, decodedAddress);
      this._nameTableData[mirroredAddress % 2048] = value;
    } else {
      this._memory[decodedAddress] = value & 0xff;
    }
  };

  public get(address: number) {
    const decodedAddress = address % 0x4000;
    if(decodedAddress < 0x2000) {
      return this._mapper.read(decodedAddress);
    } else if(decodedAddress < 0x3f00) {
      const mode = this._mapper.cartridge.mirror;
      const mirroredAddress = this._getMirrorAddress(mode, decodedAddress);

      return this._nameTableData[mirroredAddress % 2048];
    }
    return this._memory[decodedAddress] & 0xff;
  };

  private _getMirrorAddress(mode: MirrorMode, address: number) {
    const addressAdjusted = (address - 0x2000) % 0x1000;
    const tableNumber = Math.trunc(addressAdjusted / 0x0400);
    const offset = addressAdjusted % 0x0400;

    return (0x2000 + MirrorLookup[mode][tableNumber] * 0x0400 + offset) & 0xffff;
  }
}

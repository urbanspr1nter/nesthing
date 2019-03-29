import { Memory } from '../memory/memory';

export enum PpuRegister {
    PPUCTRL = 0x2000,
    PPUMASK = 0x2001,
    PPUSTATUS = 0x2002,
    OAMADDR = 0x2003,
    OAMDATA = 0x2004,
    PPUSCROLL = 0x2005,
    PPUADDR = 0x2006,
    PPUDATA = 0x2007,
    OAMDMA = 0x4014
};

export enum PpuCtrlBits {
    NametableSelect = 0, // 2 bits
    Increment = 2,
    SpriteTileSelect = 3,
    BackgroundTileSelect = 4,
    SpriteHeight = 5,
    MasterToggle = 6,
    Vblank = 7,
};

export class Ppu {
    private _memory: Memory;

    constructor(memory: Memory) {
        this._memory = memory;
    }

    public setPpuCtrlBits(bits: PpuCtrlBits, value: number) {
        switch(bits) {
            case PpuCtrlBits.NametableSelect:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL & ))
        }
    }

    public write = (register: PpuRegister, data: number): void => {
        this._memory.set(register, data & 0xFF);
    }

    public read = (register: PpuRegister): number => {
        return this._memory.get(register);
    }

    
}

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
    NametableSelectLsb = 0,
    NametableSelectMsb = 1,
    Increment = 2,
    SpriteTileSelect = 3,
    BackgroundTileSelect = 4,
    SpriteHeight = 5,
    MasterToggle = 6,
    Vblank = 7,
};

export enum PpuMaskBits {
    Greyscale = 0,
    ShowBackgroundInLeftmost = 1,
    ShowSpritesInLeftmost = 2,
    ShowBackground = 3,
    ShowSprites = 4,
    EmphasizeRed = 5,
    EmphasizeGreen = 6,
    EmphasizeBlue = 7
}

export class Ppu {
    private _memory: Memory;
    private _cycles: number;
    private _scanlines: number;

    constructor(memory: Memory) {
        this._memory = memory;
        this._scanlines = 0;
        this._cycles = 0;
    }

    public addCycles(cpuCycles: number) {
        this._cycles = this._cycles + (cpuCycles * 3);
        if(this._cycles > 341) {
            this._scanlines++;

            const remaining = this._cycles - 341;
            this._cycles = remaining;
        }
    }

    public getCycles(): number {
        return this._cycles;
    }

    public getScanlines() {
        return this._scanlines;
    }

    public setPpuCtrlBits(bits: PpuCtrlBits) {
        switch(bits) {
            case PpuCtrlBits.NametableSelectLsb:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) | (0x01));
                break;
            case PpuCtrlBits.NametableSelectMsb: 
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) | (0x02));
                break;
            case PpuCtrlBits.Increment:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) | (0x04));
                break;
            case PpuCtrlBits.SpriteTileSelect:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) | (0x08));
                break;
            case PpuCtrlBits.BackgroundTileSelect:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) | (0x10));
                break;
            case PpuCtrlBits.SpriteHeight:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) | (0x20));
                break;
            case PpuCtrlBits.MasterToggle:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) | (0x40));
                break;
            case PpuCtrlBits.Vblank:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) | (0x80));
                break;
        }
    }

    public clearPpuCtrlBits(bits: PpuCtrlBits) {
        switch(bits) {
            case PpuCtrlBits.NametableSelectLsb:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) & ~(0x01));
                break;
            case PpuCtrlBits.NametableSelectMsb: 
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) & ~(0x02));
                break;
            case PpuCtrlBits.Increment:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) & ~(0x04));
                break;
            case PpuCtrlBits.SpriteTileSelect:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) & ~(0x08));
                break;
            case PpuCtrlBits.BackgroundTileSelect:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) & ~(0x10));
                break;
            case PpuCtrlBits.SpriteHeight:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) & ~(0x20));
                break;
            case PpuCtrlBits.MasterToggle:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) & ~(0x40));
                break;
            case PpuCtrlBits.Vblank:
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) &  ~(0x80));
                break;
        }
    }

    public setPpuMaskBits(bits: PpuMaskBits) {
    }

    public clearPpuMaskBits(bits: PpuMaskBits) {
    }

    public write = (register: PpuRegister, data: number): void => {
        this._memory.set(register, data & 0xFF);
    }

    public read = (register: PpuRegister): number => {
        return this._memory.get(register);
    }

    
}

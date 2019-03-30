import { PpuMemory } from '../memory/ppumemory';
import { OamMemory } from '../memory/oammemory';
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
    private _ppuMemory: PpuMemory;
    private _oamMemory: OamMemory;

    private _currentVramWriteAddress: number;
    private _currentVramWriteAddresShiftCount: number;
    private _currentVramReadAddress: number;
    private _currentVramReadAddressShiftCount: number;

    private _startVblank: boolean;
    private _vblankNmi: boolean;

    private _cycles: number;
    private _scanlines: number;

    constructor(memory: Memory) {
        this._memory = memory;
        this._ppuMemory = new PpuMemory();
        this._oamMemory = new OamMemory();

        this._startVblank = false;
        this._vblankNmi = false;

        this._scanlines = 0;
        this._cycles = 0;
    }

    public addCycles(cpuCycles: number) {
        this._cycles = this._cycles + (cpuCycles * 3);
        if(this._cycles > 341) {
            this._scanlines++;

            if(this._scanlines === 242) {
                this._startVblank = true;
            }

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

    public isVblankNmi() {
        return this._vblankNmi;
    }

    public clearVblankNmi() {
        this._vblankNmi = false;
    }

    public run() {
        // RUN THE PPU!
        if(this._isInVblankScanline() && this._startVblank) {
            // START THE VBLANK!
            // 1. SET VBLANK!
            
            this._startVblank = false;
            // 2. Tell CPU to RUN VBLANK NMI
            this._vblankNmi = true;
        }


        // Programmer make PPU Memory accesses if we are in the VBLANk range.
        this._readFromVram();
        this._writeToVram();

        // Tick!
        this.addCycles(1);
        
    }

    private _writeToVram(): boolean {
        if(this._currentVramWriteAddresShiftCount === 0) {
            this._currentVramWriteAddress = this._memory.get(PpuRegister.PPUADDR);
            this._currentVramWriteAddresShiftCount++;

            return false;
        } else if(this._currentVramWriteAddresShiftCount === 1) {
            this._currentVramWriteAddress = (this._memory.get(PpuRegister.PPUADDR) << 8) | this._currentVramWriteAddress;
            this._currentVramWriteAddresShiftCount++;

            return false;
        } else {
            this._currentVramWriteAddresShiftCount = 0;
            this._ppuMemory.set(this._currentVramWriteAddress, this._memory.get(PpuRegister.PPUDATA));

            return true;
        }
    }

    private _readFromVram(): boolean {
        if(this._currentVramReadAddressShiftCount === 0) {
            this._currentVramReadAddress = this._memory.get(PpuRegister.PPUADDR);
            this._currentVramReadAddressShiftCount++;
            return false;

        } else if(this._currentVramReadAddressShiftCount === 1) {
            this._currentVramReadAddress = (this._memory.get(PpuRegister.PPUADDR) << 8) | this._currentVramReadAddress;
            this._currentVramReadAddressShiftCount++;

            return false;
        } else {
            this._currentVramReadAddressShiftCount = 0;
            this._memory.set(PpuRegister.PPUDATA, this._ppuMemory.get(this._currentVramReadAddress));

            return true;
        }
    }

    private _isInPreRenderScanline(): boolean {
        return this._scanlines === 0 || this._scanlines === 262 
            ? true : false;
    }

    private _isInVblankScanline(): boolean {
        return this._scanlines >= 242 && this._scanlines <= 261 
            ? true : false;
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
}

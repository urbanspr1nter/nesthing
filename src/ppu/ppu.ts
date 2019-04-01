import { PpuMemory } from '../memory/ppumemory';
import { OamMemory } from '../memory/oammemory';
import { PpuActionQueue } from './ppu-action-queue';

// Background Shift Registers
export const TileShiftRegister1 = {
    HighByte: 0,
    LowByte: 0
};

export const TileShiftRegister2 = {
    HighByte: 0,
    LowByte: 0
};

export const PaletteShiftRegister1 = {
    Value: 0
}

export const PaletteShiftRegister2 = {
    Value: 0
}

// Sprite Shift Registers
export interface ISpriteShiftRegisterPair {
    Value0: number;
    Value1: number;
};

// 8 pairs
export const SpritShiftRegisters: ISpriteShiftRegisterPair[] = [];



export const BaseNametableAddresses = {
    0x00: 0x2000,
    0x01: 0x2400,
    0x02: 0x2800,
    0x03: 0x2C00
};

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

// PPUCTRL (0x2000)
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

// PPUMASK (0x2001)
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

// PPUSTATUS (0x2002)
export enum PpuStatusBits {
    SpriteOverflow = 5,
    SpriteZeroHit = 6,
    VblankStarted = 7
}

export const IgnoredWritesBeforeWarmedUp = [
    PpuRegister.PPUCTRL, 
    PpuRegister.PPUMASK, 
    PpuRegister.PPUSCROLL, 
    PpuRegister.PPUADDR
];

// PPUCTRL, PPUMASK, PPUSCROLL, PPUADDR registers are not functional
// --> PPUSCROLL and PPLUADDR Latches will not toggle.
const cpuCyclesToWarmUp = 29658;

export class Ppu {
    private _ppuActionQueue: PpuActionQueue;
    private _ppuMemory: PpuMemory;
    private _oamMemory: OamMemory;

    private _ppuDataReadBuffer: number;
    private _tVramAddress: number;
    private _vramAddress: number;
    private _isSecondWrite: boolean;

    private _cycles: number;

    private _currentCyclesInRun: number;
    private _scanlines: number;

    private _regPPUCTRL: number;

    constructor(ppuMemory: PpuMemory, ppuActionQueue: PpuActionQueue) {
        this._ppuActionQueue = ppuActionQueue;
        this._ppuMemory = ppuMemory;
        this._oamMemory = new OamMemory();

        this._currentCyclesInRun = 0;
        this._scanlines = -1;
        this._cycles = 0;

        this._vramAddress = 0;
        this._tVramAddress = 0;
        this._isSecondWrite = false;

        // PPUCTRL
        this._regPPUCTRL = 0;
    }

    public viewPpuMemory() {
        this._ppuMemory.printView();
    }

    public viewOamMemory() {
        this._oamMemory.printView();
    }

    public addPpuCyclesInRun(ppuCycles: number) {
        this._currentCyclesInRun += ppuCycles;
        this.addPpuCycles(ppuCycles);
    }

    public addPpuCycles(cycles: number) {
        this._cycles += cycles;

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

    public write$2006(dataByte: number) {
        if(!this._isSecondWrite) {
            this._tVramAddress = dataByte;
            this._isSecondWrite = true;
        } else {
            this._vramAddress = ((this._tVramAddress << 8) | dataByte) & 0x3FFF;
        }
    }

    public write$2007(dataByte: number) {
        this._ppuMemory.set(this._vramAddress, dataByte);
        
        const vramIncrement = (this._regPPUCTRL & (0x1 << PpuCtrlBits.Increment)) > 0x0 
            ? 32 
            : 1;

        this._vramAddress += vramIncrement;
    }

    public read$2007() {
        const result = this._ppuDataReadBuffer;

        this._ppuDataReadBuffer = this._ppuMemory.get(this._vramAddress);

        const vramIncrement = (this._regPPUCTRL & (0x1 << PpuCtrlBits.Increment)) > 0x0 
            ? 32 
            : 1;

        this._vramAddress += vramIncrement;    

        return result;
    }

    public run(maxCycles: number): number {
        this._currentCyclesInRun = 0;
        
        // We need to process the memory accesses and get it to a state where it is in 
        // sync with the CPU in terms of time. We have kept a queue of memory operations 
        // here to do just that. 
        while(!this._ppuActionQueue.empty()) {
        }

        return this._currentCyclesInRun;
    }
}

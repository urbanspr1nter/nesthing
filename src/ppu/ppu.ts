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

export enum PpuStatusBits {
    SpriteOverflow = 5,
    SpriteZeroHit = 6,
    VblankStarted = 7
}

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

    private _cycles: number;
    private _scanlines: number;

    constructor(memory: Memory) {
        this._memory = memory;
        this._ppuMemory = new PpuMemory();
        this._oamMemory = new OamMemory();

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

    public isVblankNmi() {
        const ppuStatus = this._memory.get(PpuRegister.PPUSTATUS);
        return (ppuStatus & (0x1 << PpuStatusBits.VblankStarted)) > 0x0;
    }

    private _startVblankNmi() {
        const ppuStatus = this._memory.get(PpuRegister.PPUSTATUS);
        this._memory.set(PpuRegister.PPUSTATUS, ppuStatus | (0x1 << PpuStatusBits.VblankStarted));
    }

    private _clearVblankNmi() {
        const ppuStatus = this._memory.get(PpuRegister.PPUSTATUS);
        this._memory.set(PpuRegister.PPUSTATUS, ppuStatus & ~(0x1 << PpuStatusBits.VblankStarted));  
    }
    public run() {
        // Pre-Render Scanline
        if(this._scanlines === -1) {
            if(this._cycles === 1) {
                this._clearVblankNmi();
            }
        }

        // The other scanlines???
        if(this._scanlines >= 0 && this._scanlines <= 239) {
            if(this._cycles === 0) {
                // Idle cycle
            } else if(this._cycles >= 1 && this._cycles <= 256) {
                // The data for each tile is fetched. (2 PPU cycles)
                // 1. Nametable byte
                // 2. Attribute table byte
                // 3. Tile bitmap low byte
                // 4. Tile bitmap high byte (+8, or maybe +32.. depends?)
            }

        }

        // POST-RENDER SCANLINE
        if(this._scanlines === 240) {
        
        }

        // VBLANK!
        if(this._scanlines >= 241 && this._scanlines <= 260) {
            // VBLANK START
            if(this._scanlines === 241 && this._cycles === 1) {
                this._startVblankNmi();
            } else {

            }
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

    private _isPreRenderScanline(): boolean {
        return this._scanlines === 262 
            ? true : false;
    }

    private _isInVblankScanline(): boolean {
        return this._scanlines >= 242 && this._scanlines <= 261 
            ? true : false;
    }
}

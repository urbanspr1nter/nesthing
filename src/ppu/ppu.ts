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

// PPUCTRL, PPUMASK, PPUSCROLL, PPUADDR registers are not functional
// --> PPUSCROLL and PPLUADDR Latches will not toggle.
const cpuCyclesToWarmUp = 29658;

export class Ppu {
    private _memory: Memory;
    private _ppuMemory: PpuMemory;
    private _oamMemory: OamMemory;

    private _ppuAddrLatch: number;
    private _ppuScrollLatch: number;

    private _currentVramReadAddress: number;

    private _cycles: number;

    private _currentCyclesInRun: number;
    private _scanlines: number;

    constructor(memory: Memory) {
        this._memory = memory;
        this._ppuMemory = new PpuMemory();
        this._oamMemory = new OamMemory();

        this._currentCyclesInRun = 0;
        this._scanlines = -1;
        this._cycles = 0;
    }

    public powerOn(): void {
        this._memory.set(PpuRegister.PPUCTRL, 0x00);
        this._memory.set(PpuRegister.PPUMASK, 0x00);
        this._memory.set(PpuRegister.PPUSTATUS, this._memory.get(PpuRegister.PPUSTATUS) & 0x60);
        this._memory.set(PpuRegister.OAMADDR, 0x00);
        this._memory.set(PpuRegister.PPUSCROLL, 0x00);
        this._memory.set(PpuRegister.PPUADDR, 0x00);
        this._memory.set(PpuRegister.PPUDATA, 0x00);
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

    private _clearSpriteZeroHit() {
        const ppuStatus = this._memory.get(PpuRegister.PPUSTATUS);
        this._memory.set(PpuRegister.PPUSTATUS, ppuStatus & ~(0x1 << PpuStatusBits.SpriteZeroHit));
    }

    private _readPpuStatus(): number {
        this._ppuAddrLatch = undefined;
        this._ppuScrollLatch = undefined;

        return this._memory.get(PpuRegister.PPUSTATUS);
    }

    public run(): number {
        this._currentCyclesInRun = 0;
        
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
                // 
                // placed into internal latches, then fed to the appropriate shift 
                // registers when it is time... (EVERY 8 CYCLES) ... 
                /// shifters are reloaded during ticks 9, 17, 25...,257

                // THEN ALSO DO SPRITE EVALUATION FOR NEXT SCANLINE ... see below
            } else if(this._cycles >= 257 && this._cycles <= 320) {
                // Tile data for the next scanline are fetched. (2 PPU cycles)
                // 1. Garbage nametable byte
                // 2. Garbage nametable bytes
                // 3. Tile bitmap low
                // 4. tilel bitmap high (+8)
            } else if(this._cycles >= 321 && this._cycles <= 336) {
                // FIRST TWO TILES OF NEXT SCANLINE ARE FETCHED!
            } else if(this._cycles >= 337 && this._cycles <= 340) {
                // two bytes are fetched. Dunno why, but 2 PPU cycles each
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

            // TICK!
            this.addPpuCyclesInRun(1);
        }

        // Programmer make PPU Memory accesses if we are in the VBLANk range.

        return this._currentCyclesInRun;
    }

    private _setVramAddress() {
        if(this._ppuAddrLatch === undefined) {
            this._ppuAddrLatch = this._memory.get(PpuRegister.PPUADDR);;
        } else {
            this._currentVramReadAddress = this._ppuAddrLatch << 8 | this._memory.get(PpuRegister.PPUADDR);
        }
    }

    private _writePpuData() {
        this._ppuMemory.set(this._currentVramReadAddress, this._memory.get(PpuRegister.PPUDATA));
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

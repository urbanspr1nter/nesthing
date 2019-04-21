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
    private _frameBuffer: number[][];

    private _cpuNmiIrq: boolean;
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
    private _regPPUMASK: number;
    private _regPPUSTATUS: number;

    constructor(ppuMemory: PpuMemory, ppuActionQueue: PpuActionQueue) {
        this._initializeFrameBuffer();

        this._cpuNmiIrq = false;
        this._ppuMemory = ppuMemory;
        this._oamMemory = new OamMemory();

        this._currentCyclesInRun = 0;
        this._scanlines = -1;
        this._cycles = 0;

        this._vramAddress = 0;
        this._tVramAddress = 0;
        this._isSecondWrite = false;

        this._regPPUCTRL = 0;
        this._regPPUMASK = 0;
        this._regPPUSTATUS = 0;
    }

    /**
     * Initializes the frame buffer. 
     * 
     * This will store the representation of the screen. 
     * 
     * Since the resolution is 256x240 for the NES, we have 
     * decided to use a 2D array of 256 rows, and 240 columns. 
     * 
     * Each element represents a single pixel.
     */
    private _initializeFrameBuffer() {
        this._frameBuffer = [];
        for(let i = 0; i < 240; i++) {
            this._frameBuffer.push([]);
            for(let j = 0; j < 256; j++) {
                this._frameBuffer[i].push(0x00);
            }
        }
    }

    /**
     * Gets the framebuffer
     */
    public frameBuffer(): number[][] {
        return this._frameBuffer;
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

        if(this._cycles >= 341) {
            this._scanlines++;
            if(this._scanlines === 261) {
                this._scanlines = -1;
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

    public write$2000(dataByte: number) {
        this._regPPUCTRL = dataByte & 0xFF;
    }

    public write$2001(dataByte: number) {
        this._regPPUMASK = dataByte & 0xFF;
    }

    public write$2002(dataByte: number) {
        this._regPPUSTATUS = dataByte & 0xFF;
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
        
        this.incrementVramAddress();
    }

    public read$2000() {
        return this._regPPUCTRL;
    }

    public read$2002() {
        const currentStatus = this._regPPUSTATUS;
        this._regPPUSTATUS = this._regPPUSTATUS & ~(0x1 << PpuStatusBits.VblankStarted);
        this._isSecondWrite = false;

        return currentStatus;
    }

    public read$2007() {
        const result = this._ppuDataReadBuffer;

        this._ppuDataReadBuffer = this._ppuMemory.get(this._vramAddress);

        this.incrementVramAddress(); 

        return result;
    }

    public incrementVramAddress() {
        const vramIncrement = (this._regPPUCTRL & (0x1 << PpuCtrlBits.Increment)) > 0x0 
            ? 32 
            : 1;
        
        this._vramAddress += vramIncrement;
    }

    public cpuNmiIrqStatus(): boolean {
        if(this._cpuNmiIrq) {
            this._cpuNmiIrq = false;
            return true;
        }

        return false;
    }


    private _getBaseNametableAddress(): number {
        const base = this._regPPUCTRL & 0x03;
        switch(base) {
            case 0x00:
                return 0x2000;
            case 0x01:
                return 0x2400;
            case 0x02:
                return 0x2800;
            case 0x03:
                return 0x2C00;
        }

        return 0x2000;
    }

    private _fetchPatternTileByte(patternIndex: number) {

    }

    /**
     * Converts an address from the name table to an attribute table address.
     * @param ntAddress Attribute table address
     */
    private _nameTableAddressToAttributeTableAddress(ntAddress: number) {
        // Nametable address: 0010 NNYY YYYX XXXX
        // Attribute Table Address: 0010 NN11 11YY YXXX

        const yBits = (ntAddress & 0x03E0); // 0000 0011 1110 0000
        const xBits = (ntAddress & 0x001F); // 0000 0000 0001 1111
        const ntBits = (ntAddress & 0x0C00); // 0000 1100 0000 0000
        const base = 0x2000; // 0010 0000 0000 0000
        const mask = 0x03C0; // 0000 0011 1100 0000

        const topYBits = (yBits & 0x0380) >> 4; // 0000 0011 1000 0000 -> 0000 0000 0011 1000
        const topXBits = (xBits & 0x001C) >> 2; // 0000 0000 0001 1100 -> 0000 0000 0000 0111 
        
        // Ex 0x2209
        //   0010 0000 0000 0000 (0x2000)
        // | 0000 0000 0000 0000 (NT BITS)
        // | 0000 0011 1100 0000 (MASK => 0x03C0)
        // | 0000 0000 0010 0000 (TOP Y)
        // | 0000 0000 0000 0010 (TOP X)
        // ------------------------
        // > 0010 0011 1110 0010 => 0x23E2

        const address = base | ntBits | mask | topYBits | topXBits;

        return address;
    }

    /**
     * Puts 1s on the area of the framebuffer in which the tile would be rendered to.
     * 
     * This is for debugging purposes if there is no graphical rendering enabled and only 
     * in text mode.
     * 
     * @param tileLocationX The tile location X component.
     * @param tileLocationY The tile location Y component.
     */
    private _debugPutPatternOntoFramebuffer(tileLocationX: number, tileLocationY: number) {
        // 32 x 30
        // Therefore if tile (1, 1) we are at => (8, 8) on frame buffer.
        // If (2, 3) then we are at => (16, 48) 
        // And finally (31, 29) we are at => (248, 232)
        
        const xStartOnFramebuffer = tileLocationX * 8;
        const yStartOnFramebuffer = tileLocationY * 8;

        for(let i = xStartOnFramebuffer; i < xStartOnFramebuffer + 8; i++) {
            for(let j = yStartOnFramebuffer; j < yStartOnFramebuffer + 8; j++) {
                this._frameBuffer[i][j] = 1;
            }
        }
    }

    public run(): number {
        this._currentCyclesInRun = 0;
        
        if(this._scanlines === -1) {
            if(this._cycles === 0) {
                // Idle Cycle
                this.addPpuCyclesInRun(1);
            } else if(this._cycles === 1) {
                this._regPPUSTATUS = this._regPPUSTATUS & ~(0x1 << PpuStatusBits.VblankStarted);
                this.addPpuCyclesInRun(1);
            } else {
                this.addPpuCyclesInRun(1);
            }
        } else if(this._scanlines >= 0 && this._scanlines <= 239) {
            if(this._cycles == 0) {
                this.addPpuCyclesInRun(1);
            } else if(this._cycles >= 1 && this._cycles <= 256) {
                /**
                 * Here's how to actually process these cycles:
                 * 
                 * Note that the vramAddress here is now set to the start of the nametable 
                 * base address. The CPU can only manipulate the VRAM address during VBLANK.
                 * 
                 * That is why it is not good to actually write to $2006 when the PPU is not 
                 * in the VBLANK state because it can potentially disrupt this section of the 
                 * routine.
                 *
                 * Anyway, to process the nametable and fill our frame-buffer, we will need to 
                 * use 8 cycles per pattern tile in which we want to render.
                 * 
                 * Then we do:
                 * 
                 * 1. Fetch the pattern tile index at the nametable location. (2 cycles)
                 * 2. Calculate the attribute address by converting the 
                 *    nametable location to attribute location. (2 cycles)
                 * 3. Increment the VRAM address within the same row.
                 * 4. Fetch the current low-byte of the pattern tile (8x1 row) (2 cycles)
                 * 5. Fetch the current high-byte of the pattern tile (8x1 row) (2 cycles)
                 * 
                 * As we can see, each "row" of the pattern tile is processed in 8 cycles. 
                 * 
                 * Therefore, 32 different pattern tiles are evaluated in a per row basis for 
                 * each scan line. (256 cycles / 8 cycles per row) = 32.
                 * 
                 * Meaning, that for each scan line, it will visit that same pattern tile 8 times 
                 * due to pattern tiles being 8x8 pixels.
                 * 
                 * 
                 * 
                 */
                
                // Fetch NT Byte
                const ntByteIndex = (this._vramAddress & 0xFFF) + this._getBaseNametableAddress();
                console.log(`NT BYTE INDEX: ${ntByteIndex.toString(16).toUpperCase()}`);
                this.incrementVramAddress();

                this.addPpuCyclesInRun(2);
            } else if(this._cycles >= 257 && this._cycles <= 320) {
                // Garbage fetch
                this.addPpuCyclesInRun(1);
            } else if(this._cycles >= 321 && this._cycles <= 336) {
                this.addPpuCyclesInRun(1);
            } else if(this._cycles >= 337 && this._cycles <= 340) {
                this.addPpuCyclesInRun(1);
            }
        } else if(this._scanlines === 240) {
            this.addPpuCyclesInRun(1);
        } else if(this._scanlines >= 241 && this._scanlines <= 260) {
            if(this._scanlines === 241 && this._cycles === 0) {
                // Idle cycle.
                this.addPpuCyclesInRun(1);
            } else if(this._scanlines === 241 && this._cycles === 1) {
                this._regPPUSTATUS = this._regPPUSTATUS | (0x1 << PpuStatusBits.VblankStarted);
                // Request an interrupt
                this._cpuNmiIrq = true;
                this.addPpuCyclesInRun(1);
            } else {
                this.addPpuCyclesInRun(1);
            }
        }

        let debugOutput = `--> PPU Cycles ${this._currentCyclesInRun}. Total: ${this._cycles}, Scanline: ${this._scanlines}`;
        console.log(debugOutput);

        return this._currentCyclesInRun;
    }
}

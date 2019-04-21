"use strict";
exports.__esModule = true;
var oammemory_1 = require("../memory/oammemory");
// Background Shift Registers
exports.TileShiftRegister1 = {
    HighByte: 0,
    LowByte: 0
};
exports.TileShiftRegister2 = {
    HighByte: 0,
    LowByte: 0
};
exports.PaletteShiftRegister1 = {
    Value: 0
};
exports.PaletteShiftRegister2 = {
    Value: 0
};
exports.BaseNametableAddresses = {
    0x00: 0x2000,
    0x01: 0x2400,
    0x02: 0x2800,
    0x03: 0x2C00
};
var PpuRegister;
(function (PpuRegister) {
    PpuRegister[PpuRegister["PPUCTRL"] = 8192] = "PPUCTRL";
    PpuRegister[PpuRegister["PPUMASK"] = 8193] = "PPUMASK";
    PpuRegister[PpuRegister["PPUSTATUS"] = 8194] = "PPUSTATUS";
    PpuRegister[PpuRegister["OAMADDR"] = 8195] = "OAMADDR";
    PpuRegister[PpuRegister["OAMDATA"] = 8196] = "OAMDATA";
    PpuRegister[PpuRegister["PPUSCROLL"] = 8197] = "PPUSCROLL";
    PpuRegister[PpuRegister["PPUADDR"] = 8198] = "PPUADDR";
    PpuRegister[PpuRegister["PPUDATA"] = 8199] = "PPUDATA";
    PpuRegister[PpuRegister["OAMDMA"] = 16404] = "OAMDMA";
})(PpuRegister = exports.PpuRegister || (exports.PpuRegister = {}));
;
// PPUCTRL (0x2000)
var PpuCtrlBits;
(function (PpuCtrlBits) {
    PpuCtrlBits[PpuCtrlBits["NametableSelectLsb"] = 0] = "NametableSelectLsb";
    PpuCtrlBits[PpuCtrlBits["NametableSelectMsb"] = 1] = "NametableSelectMsb";
    PpuCtrlBits[PpuCtrlBits["Increment"] = 2] = "Increment";
    PpuCtrlBits[PpuCtrlBits["SpriteTileSelect"] = 3] = "SpriteTileSelect";
    PpuCtrlBits[PpuCtrlBits["BackgroundTileSelect"] = 4] = "BackgroundTileSelect";
    PpuCtrlBits[PpuCtrlBits["SpriteHeight"] = 5] = "SpriteHeight";
    PpuCtrlBits[PpuCtrlBits["MasterToggle"] = 6] = "MasterToggle";
    PpuCtrlBits[PpuCtrlBits["Vblank"] = 7] = "Vblank";
})(PpuCtrlBits = exports.PpuCtrlBits || (exports.PpuCtrlBits = {}));
;
// PPUMASK (0x2001)
var PpuMaskBits;
(function (PpuMaskBits) {
    PpuMaskBits[PpuMaskBits["Greyscale"] = 0] = "Greyscale";
    PpuMaskBits[PpuMaskBits["ShowBackgroundInLeftmost"] = 1] = "ShowBackgroundInLeftmost";
    PpuMaskBits[PpuMaskBits["ShowSpritesInLeftmost"] = 2] = "ShowSpritesInLeftmost";
    PpuMaskBits[PpuMaskBits["ShowBackground"] = 3] = "ShowBackground";
    PpuMaskBits[PpuMaskBits["ShowSprites"] = 4] = "ShowSprites";
    PpuMaskBits[PpuMaskBits["EmphasizeRed"] = 5] = "EmphasizeRed";
    PpuMaskBits[PpuMaskBits["EmphasizeGreen"] = 6] = "EmphasizeGreen";
    PpuMaskBits[PpuMaskBits["EmphasizeBlue"] = 7] = "EmphasizeBlue";
})(PpuMaskBits = exports.PpuMaskBits || (exports.PpuMaskBits = {}));
// PPUSTATUS (0x2002)
var PpuStatusBits;
(function (PpuStatusBits) {
    PpuStatusBits[PpuStatusBits["SpriteOverflow"] = 5] = "SpriteOverflow";
    PpuStatusBits[PpuStatusBits["SpriteZeroHit"] = 6] = "SpriteZeroHit";
    PpuStatusBits[PpuStatusBits["VblankStarted"] = 7] = "VblankStarted";
})(PpuStatusBits = exports.PpuStatusBits || (exports.PpuStatusBits = {}));
exports.IgnoredWritesBeforeWarmedUp = [
    PpuRegister.PPUCTRL,
    PpuRegister.PPUMASK,
    PpuRegister.PPUSCROLL,
    PpuRegister.PPUADDR
];
// PPUCTRL, PPUMASK, PPUSCROLL, PPUADDR registers are not functional
// --> PPUSCROLL and PPLUADDR Latches will not toggle.
var cpuCyclesToWarmUp = 29658;
var Ppu = /** @class */ (function () {
    function Ppu(ppuMemory, ppuActionQueue) {
        this._initializeFrameBuffer();
        this._cpuNmiIrq = false;
        this._ppuMemory = ppuMemory;
        this._oamMemory = new oammemory_1.OamMemory();
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
    Ppu.prototype._initializeFrameBuffer = function () {
        this._frameBuffer = [];
        for (var i = 0; i < 240; i++) {
            this._frameBuffer.push([]);
            for (var j = 0; j < 256; j++) {
                this._frameBuffer[i].push(0x00);
            }
        }
    };
    /**
     * Gets the framebuffer
     */
    Ppu.prototype.frameBuffer = function () {
        return this._frameBuffer;
    };
    Ppu.prototype.viewPpuMemory = function () {
        this._ppuMemory.printView();
    };
    Ppu.prototype.viewOamMemory = function () {
        this._oamMemory.printView();
    };
    Ppu.prototype.addPpuCyclesInRun = function (ppuCycles) {
        this._currentCyclesInRun += ppuCycles;
        this.addPpuCycles(ppuCycles);
    };
    Ppu.prototype.addPpuCycles = function (cycles) {
        this._cycles += cycles;
        if (this._cycles >= 341) {
            this._scanlines++;
            if (this._scanlines === 261) {
                this._scanlines = -1;
            }
            var remaining = this._cycles - 341;
            this._cycles = remaining;
        }
    };
    Ppu.prototype.getCycles = function () {
        return this._cycles;
    };
    Ppu.prototype.getScanlines = function () {
        return this._scanlines;
    };
    Ppu.prototype.write$2000 = function (dataByte) {
        this._regPPUCTRL = dataByte & 0xFF;
    };
    Ppu.prototype.write$2001 = function (dataByte) {
        this._regPPUMASK = dataByte & 0xFF;
    };
    Ppu.prototype.write$2002 = function (dataByte) {
        this._regPPUSTATUS = dataByte & 0xFF;
    };
    Ppu.prototype.write$2006 = function (dataByte) {
        if (!this._isSecondWrite) {
            this._tVramAddress = dataByte;
            this._isSecondWrite = true;
        }
        else {
            this._vramAddress = ((this._tVramAddress << 8) | dataByte) & 0x3FFF;
            this._isSecondWrite = false;
        }
    };
    Ppu.prototype.write$2007 = function (dataByte) {
        this._ppuMemory.set(this._vramAddress, dataByte);
        this.incrementVramAddress();
    };
    Ppu.prototype.read$2000 = function () {
        return this._regPPUCTRL;
    };
    Ppu.prototype.read$2002 = function () {
        var currentStatus = this._regPPUSTATUS;
        this._regPPUSTATUS = this._regPPUSTATUS & ~(0x1 << PpuStatusBits.VblankStarted);
        this._isSecondWrite = false;
        return currentStatus;
    };
    Ppu.prototype.read$2007 = function () {
        var result = this._ppuDataReadBuffer;
        this._ppuDataReadBuffer = this._ppuMemory.get(this._vramAddress);
        this.incrementVramAddress();
        return result;
    };
    Ppu.prototype.incrementVramAddress = function () {
        var vramIncrement = (this._regPPUCTRL & (0x1 << PpuCtrlBits.Increment)) > 0x0
            ? 32
            : 1;
        this._vramAddress += vramIncrement;
    };
    Ppu.prototype.cpuNmiIrqStatus = function () {
        if (this._cpuNmiIrq) {
            this._cpuNmiIrq = false;
            return true;
        }
        return false;
    };
    Ppu.prototype._getBaseNametableAddress = function () {
        var base = this._regPPUCTRL & 0x03;
        switch (base) {
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
    };
    Ppu.prototype._fetchPatternTileByte = function (patternIndex) {
    };
    /**
     * Converts an address from the name table to an attribute table address.
     * @param ntAddress Attribute table address
     */
    Ppu.prototype._nameTableAddressToAttributeTableAddress = function (ntAddress) {
        // Nametable address: 0010 NNYY YYYX XXXX
        // Attribute Table Address: 0010 NN11 11YY YXXX
        var yBits = (ntAddress & 0x03E0); // 0000 0011 1110 0000
        var xBits = (ntAddress & 0x001F); // 0000 0000 0001 1111
        var ntBits = (ntAddress & 0x0C00); // 0000 1100 0000 0000
        var base = 0x2000; // 0010 0000 0000 0000
        var mask = 0x03C0; // 0000 0011 1100 0000
        var topYBits = (yBits & 0x0380) >> 4; // 0000 0011 1000 0000 -> 0000 0000 0011 1000
        var topXBits = (xBits & 0x001C) >> 2; // 0000 0000 0001 1100 -> 0000 0000 0000 0111 
        // Ex 0x2209
        //   0010 0000 0000 0000 (0x2000)
        // | 0000 0000 0000 0000 (NT BITS)
        // | 0000 0011 1100 0000 (MASK => 0x03C0)
        // | 0000 0000 0010 0000 (TOP Y)
        // | 0000 0000 0000 0010 (TOP X)
        // ------------------------
        // > 0010 0011 1110 0010 => 0x23E2
        var address = base | ntBits | mask | topYBits | topXBits;
        return address;
    };
    /**
     * Puts 1s on the area of the framebuffer in which the tile would be rendered to.
     *
     * This is for debugging purposes if there is no graphical rendering enabled and only
     * in text mode.
     *
     * @param tileLocationX The tile location X component.
     * @param tileLocationY The tile location Y component.
     */
    Ppu.prototype._debugPutPatternOntoFramebuffer = function (tileLocationX, tileLocationY) {
        // 32 x 30
        // Therefore if tile (1, 1) we are at => (8, 8) on frame buffer.
        // If (2, 3) then we are at => (16, 48) 
        // And finally (31, 29) we are at => (248, 232)
        var xStartOnFramebuffer = tileLocationX * 8;
        var yStartOnFramebuffer = tileLocationY * 8;
        for (var i = xStartOnFramebuffer; i < xStartOnFramebuffer + 8; i++) {
            for (var j = yStartOnFramebuffer; j < yStartOnFramebuffer + 8; j++) {
                this._frameBuffer[i][j] = 1;
            }
        }
    };
    Ppu.prototype.run = function () {
        this._currentCyclesInRun = 0;
        if (this._scanlines === -1) {
            if (this._cycles === 0) {
                // Idle Cycle
                this.addPpuCyclesInRun(1);
            }
            else if (this._cycles === 1) {
                this._regPPUSTATUS = this._regPPUSTATUS & ~(0x1 << PpuStatusBits.VblankStarted);
                this.addPpuCyclesInRun(1);
            }
            else {
                this.addPpuCyclesInRun(1);
            }
        }
        else if (this._scanlines >= 0 && this._scanlines <= 239) {
            if (this._cycles == 0) {
                this.addPpuCyclesInRun(1);
            }
            else if (this._cycles >= 1 && this._cycles <= 256) {
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
                var ntByteIndex = (this._vramAddress & 0xFFF) + this._getBaseNametableAddress();
                // console.log(`NT BYTE INDEX: ${ntByteIndex.toString(16).toUpperCase()}`);
                this.incrementVramAddress();
                this.addPpuCyclesInRun(2);
            }
            else if (this._cycles >= 257 && this._cycles <= 320) {
                // Garbage fetch
                this.addPpuCyclesInRun(1);
            }
            else if (this._cycles >= 321 && this._cycles <= 336) {
                this.addPpuCyclesInRun(1);
            }
            else if (this._cycles >= 337 && this._cycles <= 340) {
                this.addPpuCyclesInRun(1);
            }
        }
        else if (this._scanlines === 240) {
            this.addPpuCyclesInRun(1);
        }
        else if (this._scanlines >= 241 && this._scanlines <= 260) {
            if (this._scanlines === 241 && this._cycles === 0) {
                // Idle cycle.
                this.addPpuCyclesInRun(1);
            }
            else if (this._scanlines === 241 && this._cycles === 1) {
                this._regPPUSTATUS = this._regPPUSTATUS | (0x1 << PpuStatusBits.VblankStarted);
                // Request an interrupt
                this._cpuNmiIrq = true;
                this.addPpuCyclesInRun(1);
            }
            else {
                this.addPpuCyclesInRun(1);
            }
        }
        var debugOutput = "--> PPU Cycles " + this._currentCyclesInRun + ". Total: " + this._cycles + ", Scanline: " + this._scanlines;
        // console.log(debugOutput);
        return this._currentCyclesInRun;
    };
    return Ppu;
}());
exports.Ppu = Ppu;

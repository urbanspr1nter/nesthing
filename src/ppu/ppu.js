"use strict";
exports.__esModule = true;
var ppumemory_1 = require("../memory/ppumemory");
var ppubus_1 = require("./ppubus");
var oammemory_1 = require("../memory/oammemory");
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
    function Ppu(memory) {
        this._memory = memory;
        this._ppuMemory = new ppumemory_1.PpuMemory();
        this._oamMemory = new oammemory_1.OamMemory();
        this._currentCyclesInRun = 0;
        this._scanlines = -1;
        this._cycles = 0;
    }
    Ppu.prototype.powerOn = function () {
        this._memory.set(PpuRegister.PPUCTRL, 0x00);
        this._memory.set(PpuRegister.PPUMASK, 0x00);
        this._memory.set(PpuRegister.PPUSTATUS, this._memory.get(PpuRegister.PPUSTATUS) & 0x60);
        this._memory.set(PpuRegister.OAMADDR, 0x00);
        this._memory.set(PpuRegister.PPUSCROLL, 0x00);
        this._memory.set(PpuRegister.PPUADDR, 0x00);
        this._memory.set(PpuRegister.PPUDATA, 0x00);
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
        if (this._cycles > 341) {
            this._scanlines++;
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
    Ppu.prototype.isVblankNmi = function () {
        var ppuStatus = this._memory.get(PpuRegister.PPUSTATUS);
        return (ppuStatus & (0x1 << PpuStatusBits.VblankStarted)) > 0x0;
    };
    Ppu.prototype._startVblankNmi = function () {
        var ppuStatus = this._memory.get(PpuRegister.PPUSTATUS);
        this._memory.set(PpuRegister.PPUSTATUS, ppuStatus | (0x1 << PpuStatusBits.VblankStarted));
    };
    Ppu.prototype._clearVblankNmi = function () {
        var ppuStatus = this._memory.get(PpuRegister.PPUSTATUS);
        this._memory.set(PpuRegister.PPUSTATUS, ppuStatus & ~(0x1 << PpuStatusBits.VblankStarted));
    };
    Ppu.prototype._clearSpriteZeroHit = function () {
        var ppuStatus = this._memory.get(PpuRegister.PPUSTATUS);
        this._memory.set(PpuRegister.PPUSTATUS, ppuStatus & ~(0x1 << PpuStatusBits.SpriteZeroHit));
    };
    Ppu.prototype._readPpuStatus = function () {
        ppubus_1.PpuGenLatch.value = undefined;
        return this._memory.get(PpuRegister.PPUSTATUS);
    };
    Ppu.prototype._writeOamData = function () {
        var oamAddr = this._memory.get(PpuRegister.OAMADDR);
        var oamData = this._memory.get(PpuRegister.OAMDATA);
        this._oamMemory.set(oamAddr, oamData);
        // Increment OAMADDR after the write!
        this._memory.set(PpuRegister.OAMADDR, oamAddr + 1);
    };
    Ppu.prototype._readOamData = function () {
        var oamAddr = this._memory.get(PpuRegister.OAMADDR);
        return this._oamMemory.get(oamAddr);
    };
    Ppu.prototype._writePpuScroll = function () {
        if (ppubus_1.PpuGenLatch.value === undefined) {
            ppubus_1.PpuGenLatch.value = this._memory.get(PpuRegister.PPUSCROLL);
        }
        else {
            this._currentNametableBaseAddress = (ppubus_1.PpuGenLatch.value << 8) | this._memory.get(PpuRegister.PPUSCROLL);
        }
    };
    Ppu.prototype.run = function () {
        this._currentCyclesInRun = 0;
        // Pre-Render Scanline
        if (this._scanlines === -1) {
            if (this._cycles === 1) {
                this._clearVblankNmi();
            }
            if (this._cycles >= 257 && this._cycles <= 320) {
                this._memory.set(PpuRegister.OAMADDR, 0x00);
            }
            this.addPpuCyclesInRun(2);
        }
        // All other visible scanlines.
        if (this._scanlines >= 0 && this._scanlines <= 239) {
            if (this._cycles === 0) {
                // Idle cycle: 
                this.addPpuCyclesInRun(1);
            }
            else if (this._cycles >= 1 && this._cycles <= 256) {
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
                this.addPpuCyclesInRun(2);
            }
            else if (this._cycles >= 257 && this._cycles <= 320) {
                // Tile data for the next scanline are fetched. (2 PPU cycles)
                // 1. Garbage nametable byte
                // 2. Garbage nametable bytes
                // 3. Tile bitmap low
                // 4. tilel bitmap high (+8)
                this.addPpuCyclesInRun(2);
            }
            else if (this._cycles >= 321 && this._cycles <= 336) {
                // FIRST TWO TILES OF NEXT SCANLINE ARE FETCHED!
                this.addPpuCyclesInRun(2);
            }
            else if (this._cycles >= 337 && this._cycles <= 340) {
                // Fetch two bytes, and add 2 PPU cycles.
                // Fetch first unused nametable byte
                this.addPpuCyclesInRun(2);
                // Fetch second unused nametable byte
                this.addPpuCyclesInRun(2);
            }
        }
        // POST-RENDER SCANLINE
        if (this._scanlines === 240) {
            this.addPpuCyclesInRun(2);
        }
        // VBLANK!
        if (this._scanlines >= 241 && this._scanlines <= 260) {
            // VBLANK START
            if (this._scanlines === 241 && this._cycles === 1) {
                this._startVblankNmi();
            }
            else {
            }
            // TICK!
            this.addPpuCyclesInRun(1);
        }
        // Programmer make PPU Memory accesses if we are in the VBLANk range.
        return this._currentCyclesInRun;
    };
    Ppu.prototype._isPpuWarmedUp = function (currentTotalCpuCycles) {
        return currentTotalCpuCycles > cpuCyclesToWarmUp;
    };
    Ppu.prototype._setVramAddress = function () {
        if (ppubus_1.PpuGenLatch.value === undefined) {
            ppubus_1.PpuGenLatch.value = this._memory.get(PpuRegister.PPUADDR);
            ;
        }
        else {
            this._currentVramReadAddress = ppubus_1.PpuGenLatch.value << 8 | this._memory.get(PpuRegister.PPUADDR);
        }
    };
    Ppu.prototype._writePpuData = function () {
        this._ppuMemory.set(this._currentVramReadAddress, this._memory.get(PpuRegister.PPUDATA));
        var vramIncrement = ((this._memory.get(PpuRegister.PPUCTRL)) & (0x1 << PpuCtrlBits.Increment)) > 0x0
            ? 32
            : 8;
        this._currentVramReadAddress += vramIncrement;
    };
    Ppu.prototype._readPpuData = function () {
    };
    Ppu.prototype._isPreRenderScanline = function () {
        return this._scanlines === 262
            ? true : false;
    };
    Ppu.prototype._isInVblankScanline = function () {
        return this._scanlines >= 242 && this._scanlines <= 261
            ? true : false;
    };
    return Ppu;
}());
exports.Ppu = Ppu;

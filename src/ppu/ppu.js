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
;
// 8 pairs
exports.SpritShiftRegisters = [];
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
        this._cpuNmiIrq = false;
        this._ppuMemory = ppuMemory;
        this._oamMemory = new oammemory_1.OamMemory();
        this._currentCyclesInRun = 0;
        this._scanlines = -1;
        this._cycles = 0;
        this._vramAddress = 0;
        this._tVramAddress = 0;
        this._isSecondWrite = false;
        // PPUCTRL
        this._regPPUCTRL = 0;
        // PPUSTATUS
        this._regPPUSTATUS = 0;
    }
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
        }
    };
    Ppu.prototype.write$2007 = function (dataByte) {
        this._ppuMemory.set(this._vramAddress, dataByte);
        var vramIncrement = (this._regPPUCTRL & (0x1 << PpuCtrlBits.Increment)) > 0x0
            ? 32
            : 1;
        this._vramAddress += vramIncrement;
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
        var vramIncrement = (this._regPPUCTRL & (0x1 << PpuCtrlBits.Increment)) > 0x0
            ? 32
            : 1;
        this._vramAddress += vramIncrement;
        return result;
    };
    Ppu.prototype.cpuNmiIrqStatus = function () {
        if (this._cpuNmiIrq) {
            this._cpuNmiIrq = false;
            return true;
        }
        return false;
    };
    Ppu.prototype.run = function () {
        this._currentCyclesInRun = 0;
        if (this._scanlines === -1) {
            console.log("Pre-Render Scanline! " + this._scanlines + ".");
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
            console.log("Visible Scanlines! " + this._scanlines + ".");
            this.addPpuCyclesInRun(1);
        }
        else if (this._scanlines === 240) {
            console.log("Post-Render Scanline! " + this._scanlines + ".");
            this.addPpuCyclesInRun(1);
        }
        else if (this._scanlines >= 241 && this._scanlines <= 260) {
            console.log("VBLANK! " + this._scanlines + ".");
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
        console.log(debugOutput);
        return this._currentCyclesInRun;
    };
    return Ppu;
}());
exports.Ppu = Ppu;

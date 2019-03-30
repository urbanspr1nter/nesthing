"use strict";
exports.__esModule = true;
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
var Ppu = /** @class */ (function () {
    function Ppu(memory) {
        var _this = this;
        this.write = function (register, data) {
            _this._memory.set(register, data & 0xFF);
        };
        this.read = function (register) {
            return _this._memory.get(register);
        };
        this._memory = memory;
        this._scanlines = 0;
        this._cycles = 0;
    }
    Ppu.prototype.addCycles = function (cpuCycles) {
        this._cycles = this._cycles + (cpuCycles * 3);
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
    Ppu.prototype.setPpuCtrlBits = function (bits) {
        switch (bits) {
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
    };
    Ppu.prototype.clearPpuCtrlBits = function (bits) {
        switch (bits) {
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
                this._memory.set(PpuRegister.PPUCTRL, this._memory.get(PpuRegister.PPUCTRL) & ~(0x80));
                break;
        }
    };
    Ppu.prototype.setPpuMaskBits = function (bits) {
    };
    Ppu.prototype.clearPpuMaskBits = function (bits) {
    };
    return Ppu;
}());
exports.Ppu = Ppu;

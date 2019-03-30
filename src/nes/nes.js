"use strict";
exports.__esModule = true;
var memory_1 = require("../memory/memory");
var ppu_1 = require("../ppu/ppu");
var cpu_1 = require("../cpu/cpu");
var fs = require("fs");
var Nes = /** @class */ (function () {
    function Nes() {
        this._log = [];
        this._memory = new memory_1.Memory();
        this._ppu = new ppu_1.Ppu(this._memory);
        this._cpu = new cpu_1.Cpu(this._memory, this._log);
    }
    Nes.prototype.run = function () {
        var _this = this;
        var romContents = fs.readFileSync('./DK.nes');
        var address = 0xC000;
        romContents.forEach(function (value) {
            if (address > 0xFFFF) {
                return;
            }
            _this._memory.set(address, value);
            address++;
        });
        romContents = fs.readFileSync('./DK.nes');
        address = 0x8000;
        romContents.forEach(function (value) {
            if (address > 0xC000) {
                return;
            }
            _this._memory.set(address, value);
            address++;
        });
        // CHR_ROM
        romContents = fs.readFileSync('./DK.nes');
        address = 0x0000;
        romContents.forEach(function (value) {
            if (address > 0x1FFF) {
                return;
            }
            _this._memory.set(address, value);
            address++;
        });
        this._cpu.powerUp();
        while (this._cpu.getCurrentCycles() <= 100) {
            // fetch
            var beginCpuCycles = this._cpu.getCurrentCycles();
            var opCode = this._memory.get(this._cpu.getPC());
            // decode, execute, wb
            this._cpu.handleOp(opCode);
            this._ppu.addCycles(this._cpu.getCurrentCycles() - beginCpuCycles);
        }
        console.log(this._ppu.getScanlines(), this._ppu.getCycles());
        console.log(this._memory.get(0x02).toString(16).toUpperCase());
        console.log(this._memory.get(0x03).toString(16).toUpperCase());
    };
    return Nes;
}());
exports.Nes = Nes;

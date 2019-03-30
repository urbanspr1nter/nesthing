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
    Nes.prototype.loadRom = function (romFilename) {
        var romContents = fs.readFileSync('./DK.nes');
        var romBytes = [];
        romContents.forEach(function (value) {
            romBytes.push(value);
        });
        var currentAddress = 0x8000;
        // Load PRG ROM from 0x8000 -> 0xBFFF
        for (var i = 0; i < romBytes.length && currentAddress < 0xC000; i++, currentAddress++) {
            this._memory.set(currentAddress, romBytes[i]);
        }
        // Load PRG ROM from 0xC000 -> 0xFFFF
        currentAddress = 0xC000;
        for (var i = 0; i < romBytes.length && currentAddress <= 0xFFFF; i++, currentAddress++) {
            this._memory.set(currentAddress, romBytes[i]);
        }
    };
    Nes.prototype.run = function () {
        this.loadRom('./DK.nes');
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

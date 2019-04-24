"use strict";
exports.__esModule = true;
var memory_1 = require("../memory/memory");
var ppu_1 = require("../ppu/ppu");
var cpu_1 = require("../cpu/cpu");
var ppumemory_1 = require("../memory/ppumemory");
var rom = require("./rom.json");
var ROM_FILE = './DK.nes';
var Nes = /** @class */ (function () {
    function Nes() {
        this._log = [];
        this._ppuMemory = new ppumemory_1.PpuMemory();
        this._ppu = new ppu_1.Ppu(this._ppuMemory);
        this._memory = new memory_1.Memory(this._ppu);
        this._cpu = new cpu_1.Cpu(this._memory, this._log);
        this._initialize();
        this._cpu.debugMode(false);
    }
    Nes.prototype.frameBuffer = function () {
        return this._ppu.frameBuffer();
    };
    Nes.prototype.loadRom = function () {
        // For now, we can only load Donkey Kong
        var romBytes = [];
        var romContents = rom.raw;
        romContents.forEach(function (value) {
            romBytes.push(value);
        });
        var currentAddress = 0x8000;
        // Load PRG ROM from 0x8000 -> 0xBFFF
        for (var i = 0; i < romBytes.length && currentAddress < 0xC000; i++, currentAddress++) {
            this._memory.set(currentAddress, romBytes[i]);
        }
        // Load PRG ROM from 0xC000 -> 0xFFFF (Mirror of 0x8000->0xBFFF)
        currentAddress = 0xC000;
        for (var i = 0; i < romBytes.length && currentAddress <= 0xFFFF; i++, currentAddress++) {
            this._memory.set(currentAddress, romBytes[i]);
        }
        // Load the CHR ROM
        var chrRomAddress = 0x4000;
        for (var i = 0x0000; i <= 0x1FFF; i++) {
            this._ppuMemory.set(i, romBytes[chrRomAddress]);
            chrRomAddress++;
        }
        // Initialize the nametables to $00
        var ntStartAddress = 0x2000;
        for (var i = ntStartAddress; i < 0x3F00; i++) {
            this._ppuMemory.set(i, 0x00);
        }
    };
    Nes.prototype.run = function (cpuCycles) {
        /**
         * The general approach to this run loop is to simulate both the CPU, PPU and APU
         * all running at the same time. Each piece of hardware will run for the necessary amount of
         * cycles.
         */
        while (this._cpu.getCurrentCycles() <= cpuCycles) {
            var beginCpuCycles = this._cpu.getCurrentCycles();
            // If we are entering in VBLANK, Enter NMI handling routine!
            if (this._ppu.cpuNmiIrqStatus() && ((this._ppu.read$2000() & 0x80) > 0x0)) {
                this._cpu.handleNmiIrq();
            }
            var opCode = this._memory.get(this._cpu.getPC());
            this._cpu.handleOp(opCode);
            var cpuCyclesRan = this._cpu.getCurrentCycles() - beginCpuCycles;
            // Run the PPU for the appropriate amount of cycles.
            var ppuCyclesToRun = cpuCyclesRan * 3;
            while (ppuCyclesToRun > 0) {
                var ppuCyclesRan = this._ppu.run();
                ppuCyclesToRun -= ppuCyclesRan;
            }
        }
        this.debugDrawFrameBuffer();
    };
    Nes.prototype.debugDrawFrameBuffer = function () {
        for (var i = 0x2000; i < 0x23BF; i++) {
            this._ppu.fetchPatternTileBytes(this._ppuMemory.get(i), i);
        }
        var fb = this._ppu.frameBuffer();
        var output = '';
        for (var i = 0; i < 240; i++) {
            for (var j = 0; j < 256; j++) {
                output += (fb[i][j] ? '□' : '■') + ' ';
            }
            output += '\n';
        }
        //console.log(output);
    };
    Nes.prototype.debugPrintCpuMemory = function () {
        console.log("====== START CPU MEMORY ======");
        this._memory.printView();
        console.log("====== END CPU MEMORY ======");
    };
    Nes.prototype.debugPrintOamMemory = function () {
        console.log("====== START OAM MEMORY ======");
        this._ppu.viewOamMemory();
        console.log("====== END OAM MEMORY ======");
    };
    Nes.prototype.debugPrintPpuMemory = function () {
        console.log("====== START PPU MEMORY ======");
        this._ppu.viewPpuMemory();
        console.log("====== END PPU MEMORY ======");
    };
    Nes.prototype._initialize = function () {
        this.loadRom();
        this._cpu.powerUp();
    };
    return Nes;
}());
exports.Nes = Nes;

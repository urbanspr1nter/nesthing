"use strict";
exports.__esModule = true;
var memory_1 = require("../memory/memory");
var ppu_1 = require("../ppu/ppu");
var cpu_1 = require("../cpu/cpu");
var ppu_action_queue_1 = require("../ppu/ppu-action-queue");
var fs = require("fs");
var ppumemory_1 = require("../memory/ppumemory");
var Nes = /** @class */ (function () {
    function Nes() {
        this._log = [];
        this._ppuMemory = new ppumemory_1.PpuMemory();
        this._ppuActionQueue = new ppu_action_queue_1.PpuActionQueue();
        this._ppu = new ppu_1.Ppu(this._ppuMemory, this._ppuActionQueue);
        this._memory = new memory_1.Memory(this._ppu);
        this._cpu = new cpu_1.Cpu(this._memory, this._ppuActionQueue, this._log);
        this._initialize();
    }
    Nes.prototype.loadRom = function (romFilename) {
        // For now, we can only load Donkey Kong
        var romBytes = [];
        var romContents = fs.readFileSync(romFilename);
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
    Nes.prototype.run = function () {
        /**
         * The general approach to this run loop is to simulate both the CPU, PPU and APU
         * all running at the same time. Each piece of hardware will run for the necessary amount of
         * cycles.
         */
        while (this._cpu.getCurrentCycles() <= 1161800) {
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
        console.log("====== START CPU MEMORY ======");
        this._memory.printView();
        console.log("====== END CPU MEMORY ======");
        console.log("====== START OAM MEMORY ======");
        this._ppu.viewOamMemory();
        console.log("====== END OAM MEMORY ======");
        console.log("====== START PPU MEMORY ======");
        this._ppu.viewPpuMemory();
        console.log("====== END PPU MEMORY ======");
    };
    Nes.prototype._initialize = function () {
        this._screen = [];
        for (var i = 0; i < 256; i++) {
            this._screen[i] = [];
            for (var j = 0; j < 240; j++) {
                this._screen[i].push(0x00);
            }
        }
        this.loadRom('./DK.nes');
        this._cpu.powerUp();
    };
    return Nes;
}());
exports.Nes = Nes;

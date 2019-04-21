import { Memory } from '../memory/memory';
import { Ppu } from '../ppu/ppu';
import { Cpu } from '../cpu/cpu';
import { PpuActionQueue } from '../ppu/ppu-action-queue';
import * as fs from 'fs';
import { PpuMemory } from '../memory/ppumemory';

export class Nes {
    private _memory: Memory;
    private _ppuMemory: PpuMemory;
    private _ppu: Ppu;
    private _cpu: Cpu;
    private _ppuActionQueue: PpuActionQueue;

    private _log: string[];

    private _screen: number[][];

    constructor() {
        this._log = [];
        this._ppuMemory = new PpuMemory();

        this._ppuActionQueue = new PpuActionQueue();
        this._ppu = new Ppu(this._ppuMemory, this._ppuActionQueue);
        this._memory = new Memory(this._ppu);
        this._cpu = new Cpu(this._memory, this._ppuActionQueue, this._log);

        this._initialize();
    }

    public loadRom(romFilename: string) {
        // For now, we can only load Donkey Kong
        const romBytes: number[] = [];

        let romContents = fs.readFileSync(romFilename);
        romContents.forEach((value) => {
            romBytes.push(value);
        });

        let currentAddress = 0x8000;
        // Load PRG ROM from 0x8000 -> 0xBFFF
        for(let i = 0; i < romBytes.length && currentAddress < 0xC000; i++, currentAddress++) {
            this._memory.set(currentAddress, romBytes[i]);
        }

        // Load PRG ROM from 0xC000 -> 0xFFFF (Mirror of 0x8000->0xBFFF)
        currentAddress = 0xC000;
        for(let i = 0; i< romBytes.length && currentAddress <= 0xFFFF; i++, currentAddress++) {
            this._memory.set(currentAddress, romBytes[i]);
        }

        // Load the CHR ROM
        let chrRomAddress = 0x4000;
        for(let i = 0x0000; i <= 0x1FFF; i++) {
            this._ppuMemory.set(i, romBytes[chrRomAddress]);
            chrRomAddress++;
        }

        // Initialize the nametables to $00
        let ntStartAddress = 0x2000;
        for(let i = ntStartAddress; i < 0x3F00; i++) {
            this._ppuMemory.set(i, 0x00);
        }
    }

    public run() {
        /**
         * The general approach to this run loop is to simulate both the CPU, PPU and APU 
         * all running at the same time. Each piece of hardware will run for the necessary amount of
         * cycles.
         */
        while(this._cpu.getCurrentCycles() <= 1161800) {
            const beginCpuCycles = this._cpu.getCurrentCycles();

            // If we are entering in VBLANK, Enter NMI handling routine!
            if(this._ppu.cpuNmiIrqStatus() && ((this._ppu.read$2000() & 0x80) > 0x0)) {
                this._cpu.handleNmiIrq();
            }

            const opCode = this._memory.get(this._cpu.getPC());
            this._cpu.handleOp(opCode);

            const cpuCyclesRan = this._cpu.getCurrentCycles() - beginCpuCycles;

            // Run the PPU for the appropriate amount of cycles.
            let ppuCyclesToRun = cpuCyclesRan * 3;
            while(ppuCyclesToRun > 0) {
                const ppuCyclesRan = this._ppu.run();                
                ppuCyclesToRun -= ppuCyclesRan;
            }
        
        }

        
        console.log("====== START CPU MEMORY ======")
        this._memory.printView();
        console.log("====== END CPU MEMORY ======")


        console.log("====== START OAM MEMORY ======")
        this._ppu.viewOamMemory();
        console.log("====== END OAM MEMORY ======")

        console.log("====== START PPU MEMORY ======")
        this._ppu.viewPpuMemory();
        console.log("====== END PPU MEMORY ======")
    }

    private _initialize() {
        this._screen = [];
        for(let i = 0; i < 256; i++) {
            this._screen[i] = [];
            for(let j = 0; j < 240; j++) {
                this._screen[i].push(0x00);
            }
        }

        this.loadRom('./DK.nes');
        this._cpu.powerUp();
    }
}

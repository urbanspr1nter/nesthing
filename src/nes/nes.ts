import { Memory } from '../memory/memory';
import { Ppu } from '../ppu/ppu';
import { Cpu } from '../cpu/cpu';
import * as fs from 'fs';

export class Nes {
    private _memory: Memory;
    private _ppu: Ppu;
    private _cpu: Cpu;

    private _log: string[];

    private _screen: number[][];

    constructor() {
        this._log = [];
        this._memory = new Memory();
        this._ppu = new Ppu(this._memory);
        this._cpu = new Cpu(this._memory, this._log);

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
    }

    public run() {
        /**
         * The general approach to this run loop is to simulate both the CPU, PPU and APU 
         * all running at the same time. Each piece of hardware will run for the necessary amount of
         * cycles.
         */
        while(this._cpu.getCurrentCycles() <= 100) {
            const beginCpuCycles = this._cpu.getCurrentCycles();

            // If we are entering in VBLANK, Enter NMI handling routine!
            if(this._ppu.getScanlines() === 242 
                && this._ppu.getCycles() === 2 
                && this._ppu.isVblankNmi()
            ) {
                this._cpu.handleNmiIrq();
            } else {
                const opCode = this._memory.get(this._cpu.getPC());
                this._cpu.handleOp(opCode);
            }

            const cpuCyclesRan = this._cpu.getCurrentCycles() - beginCpuCycles;

            // Run the PPU for the appropriate amount of cycles.
            let ppuCyclesToRun = cpuCyclesRan * 3;
            while(ppuCyclesToRun > 0) {
                const ppuCyclesRan = this._ppu.run();                
                ppuCyclesToRun -= ppuCyclesRan;

                // Fire a dot into the screen
                // this._screen.doSOMETHING!
            }
        }
    }

    private _initialize() {
        for(let i = 0; i < 256; i++) {
            this._screen.push([]);
            for(let j = 0; j < 240; j++) {
                this._screen[i].push(0x00);
            }
        }

        this.loadRom('./DK.nes');
        this._cpu.powerUp();
        this._ppu.powerOn();
    }
}

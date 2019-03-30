import { Memory } from '../memory/memory';
import { Ppu } from '../ppu/ppu';
import { Cpu } from '../cpu/cpu';
import { 
    NmiVectorLocation
} from '../cpu/cpu.interface';
import * as fs from 'fs';

export class Nes {
    private _memory: Memory;
    private _ppu: Ppu;
    private _cpu: Cpu;

    private _log: string[];

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
            if(this._ppu.isVblankNmi()) {
                this._cpu.handleNmiIrq();

                this._cpu.setPC(
                    (this._memory.get(NmiVectorLocation.High) << 8) 
                        | this._memory.get(NmiVectorLocation.Low)
                );
                // Make sure during next execution, we continue the routine.
                this._ppu.clearVblankNmi();
            } else {
                const opCode = this._memory.get(this._cpu.getPC());
                this._cpu.handleOp(opCode);
            }

            const cpuCyclesRan = this._cpu.getCurrentCycles() - beginCpuCycles;

            // Run the PPU for the appropriate amount of cycles.
            let ppuCyclesToRun = cpuCyclesRan * 3;
            while(ppuCyclesToRun > 0) {
                this._ppu.run();
                ppuCyclesToRun--;
            }
        }
    }

    private _initialize() {
        this.loadRom('./DK.nes');
        this._cpu.powerUp();
    }
}

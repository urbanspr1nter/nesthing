import { Memory } from '../memory/memory';
import { Ppu, ColorComponent } from '../ppu/ppu';
import { Cpu } from '../cpu/cpu';
import { PpuMemory } from '../memory/ppumemory';
import * as rom from './rom.json';

const ROM_FILE = './DK.nes';

export interface CpuRegisters {
    pc: number;
    a: number;
    x: number;
    y: number;
    sp: number;
    p: number;
}

export class Nes {
    private _memory: Memory;
    private _ppuMemory: PpuMemory;
    private _ppu: Ppu;
    private _cpu: Cpu;

    private _log: string[];

    constructor() {
        this._log = [];
        this._ppuMemory = new PpuMemory();

        this._ppu = new Ppu(this._ppuMemory);
        this._memory = new Memory(this._ppu);
        this._cpu = new Cpu(this._memory, this._log);

        this._initialize();

        this._cpu.debugMode(false);
    }

    public frameBuffer(): ColorComponent[][] {
        return this._ppu.frameBuffer();
    }

    public cpuMemory(): number[] {
        return this._memory.bits;
    }

    public ppuMemory(): number[] {
        return this._ppuMemory.bits;
    }

    public cpuRegisters(): CpuRegisters {
        return {
            pc: this._cpu.getPC(),
            a: this._cpu.getA(),
            x: this._cpu.getX(),
            y: this._cpu.getY(),
            sp: this._cpu.getSP(),
            p: this._cpu.getP()
        }
    } 

    public loadRom() {
        // For now, we can only load Donkey Kong
        const romBytes: number[] = [];

        const romContents = rom.raw;
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

    public run(cpuCycles: number) {
        /**
         * The general approach to this run loop is to simulate both the CPU, PPU and APU 
         * all running at the same time. Each piece of hardware will run for the necessary amount of
         * cycles.
         */
        while(this._cpu.getCurrentCycles() <= cpuCycles) {
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

        this.debugDrawFrameBuffer();
    }

    public debugDrawFrameBuffer() {
        for(let i = 0x2000; i < 0x23BF; i++) {
            this._ppu.fetchPatternTileBytes(this._ppuMemory.get(i), i);
        }
        const fb = this._ppu.frameBuffer();

        let output = '';
        for(let i = 0; i < 240; i++) {
            for(let j = 0; j < 256; j++) {
                output += (fb[i][j] ? '□' : '■') + ' ';
            }
            output += '\n';
        }
    }

    public debugPrintCpuMemory() {
        console.log("====== START CPU MEMORY ======")
        this._memory.printView();
        console.log("====== END CPU MEMORY ======")
    }

    public debugPrintOamMemory() {
        console.log("====== START OAM MEMORY ======")
        this._ppu.viewOamMemory();
        console.log("====== END OAM MEMORY ======")
    }

    public debugPrintPpuMemory() {
        console.log("====== START PPU MEMORY ======")
        this._ppu.viewPpuMemory();
        console.log("====== END PPU MEMORY ======")
    }

    private _initialize() {
        this.loadRom();
        this._cpu.powerUp();
    }
}

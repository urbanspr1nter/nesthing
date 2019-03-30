import { Memory } from '../memory/memory';
import { Ppu } from '../ppu/ppu';
import { Cpu } from '../cpu/cpu';
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
        while(this._cpu.getCurrentCycles() <= 100) {
            // fetch
            const beginCpuCycles = this._cpu.getCurrentCycles();
            const opCode = this._memory.get(this._cpu.getPC());

            // decode, execute, wb
            this._cpu.handleOp(opCode);

            const cpuCyclesRan = this._cpu.getCurrentCycles() - beginCpuCycles;

            this._ppu.addCycles(cpuCyclesRan);
        }

        // console.log(this._ppu.getScanlines(), this._ppu.getCycles());
        // console.log(this._memory.get(0x02).toString(16).toUpperCase());
        // console.log(this._memory.get(0x03).toString(16).toUpperCase());

    }

    private _initialize() {
        this.loadRom('./DK.nes');
        this._cpu.powerUp();
    }
}

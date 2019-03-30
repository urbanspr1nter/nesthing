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
    }

    run() {
        let romContents = fs.readFileSync('./DK.nes');

        let address = 0xC000;
        romContents.forEach((value) => {
            if(address > 0xFFFF) {
                return;
            }
            this._memory.set(address, value);
            address++;
        });

        romContents = fs.readFileSync('./DK.nes');
        address = 0x8000;
        romContents.forEach((value) => {
            if(address > 0xC000) {
                return;
            }
            this._memory.set(address, value);
            address++;
        });

        // CHR_ROM
        romContents = fs.readFileSync('./DK.nes');
        address = 0x0000;
        romContents.forEach((value) => {
            if(address > 0x1FFF) {
                return;
            }
            this._memory.set(address, value);
            address++;
        });

        this._cpu.powerUp();

        while(this._cpu.getCurrentCycles() <= 100) {
            // fetch
            const beginCpuCycles = this._cpu.getCurrentCycles();
            const opCode = this._memory.get(this._cpu.getPC());

            // decode, execute, wb
            this._cpu.handleOp(opCode);
            this._ppu.addCycles(this._cpu.getCurrentCycles() - beginCpuCycles);
        }

        console.log(this._ppu.getScanlines(), this._ppu.getCycles());
        console.log(this._memory.get(0x02).toString(16).toUpperCase());
        console.log(this._memory.get(0x03).toString(16).toUpperCase());

    }
}

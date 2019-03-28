import { Memory } from '../memory/memory';
import { Cpu } from '../cpu/cpu';
import * as fs from 'fs';

export class Nes {
    private _memory: Memory;
    private _cpu: Cpu;

    private _log: string[];

    constructor() {
        this._log = [];
        this._memory = new Memory();
        this._cpu = new Cpu(this._memory, this._log);
    }

    run() {
        this._cpu.powerUp();

        const romContents = fs.readFileSync('./nestest.nes');

        let address = 0xC000;
        romContents.forEach((value, index) => {
            this._memory.set(address, value);
            address++;
        });

        while(this._cpu.getCurrentCycles() <= 26556) {
            // fetch
            const opCode = this._memory.get(this._cpu.getPC());

            //console.log(opCode.toString(16));
            // decode, execute, wb
            this._cpu.handleOp(opCode);
        }

        for(const entry of this._log) {
            //console.log(entry);
        }

        console.log(this._memory.get(0x02).toString(16).toUpperCase());
        console.log(this._memory.get(0x03).toString(16).toUpperCase());

    }
}

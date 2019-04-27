const MaxMemoryAddress = 0x3FFF;

export class PpuMemory {
    private _memory: number[];

    constructor() {
        this._memory = [];

        // Blank out
        for(let i = 0x0000; i <= MaxMemoryAddress; i++) {
            this._memory[i] = 0xFF;
        }
    }

    get bits(): number[] {
        return this._memory;
    }

    public set = (address: number, value: number): void  => {
        this._memory[address & MaxMemoryAddress] = value & 0xFF;
    }

    public get = (address: number) => {
        return this._memory[address] & 0xFF;
    }

    public printView() {
        let output = "";
        for(let i = 0; i <= MaxMemoryAddress; i++) {
            if(i % 0x20 === 0) {
                let label = i.toString(16).toUpperCase();
                let padding = 4 - label.length;
                for(let j = 0; j < padding; j++) {
                    label = '0' + label;
                }
                output += `\n${label}:\t\t`;
            }
            let val = `${this._memory[i].toString(16).toUpperCase()}`;
            if(val.length < 2) {
                val = `0${val}`;
            }
            output += `0x${val}` + "\t";
        }

        console.log(output); 
    }
}

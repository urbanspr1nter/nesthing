export class Memory {
    private _memory: number[];
    
    constructor() {
        this._memory = [];

        // Blank out the memory
        for(let i = 0; i <= 0xFFFF; i++) {
            this.set(i, 0xFF);
        }
    }

    public set(address: number, value: number): void {
        // Mirrored at 0x0800 - 0x0FFF
        //  -> 0x800 - 0x0FFF
        //  -> 0x1000 - 0x17FF
        //  -> 0x1800 - 0x1FFF
        value = value & 0xFF;
        if(address >= 0x800 && address <= 0x0FFF) {
            this._memory[address & 0xFFFF] = value;
            this._memory[(address + 1*0x800) & 0xFFFF] = value;
            this._memory[(address + 2*0x800) & 0xFFFF] = value;
        } else if(address >= 0x1000 && address <= 0x17FF) {
            this._memory[(address - 1*0x800) & 0xFFFF] = value;
            this._memory[address & 0xFFFF] = value;
            this._memory[(address + 1*0x800) & 0xFFFF] = value;
        } else if(address >= 0x1800 && address <= 0x1FFF) {
            this._memory[(address - 2*0x800) & 0xFFFF] = value;
            this._memory[(address - 1*0x800) & 0xFFFF] = value;
            this._memory[address & 0xFFFF] = value;
        } else if(address >= 0x2000 && address <= 0x3FFF) {
            // PPU registers: 0x2000-0x2007
            // -> Mirrored: 0x2008-0x3FFF
            //  -> (Every 8 bytes)   
            this._memory[(0x20 << 8) | (address & 0x0007)] = value;         
        } else {
            this._memory[address & 0xFFFF] = value;
        }
    }

    public get(address: number): number {
        if(address >= 0x2000 && address <= 0x3FFF) {
            return this._memory[(0x20 << 8) | (address & 0x0007)];
        }
        return this._memory[address & 0xFFFF] & 0xFF;
    }

    public printView() {
        let output = "";
        for(let i = 0; i <= 0xFFFF; i++) {
            if(i % 0x10 === 0) {
                let label = i.toString(16).toUpperCase();
                let padding = 4 - label.length;
                for(let j = 0; j < padding; j++) {
                    label = '0' + label;
                }
                output += `\n${label}:\t\t`;
            }
            let val = `${this.get(i).toString(16).toUpperCase()}`;
            if(val.length < 2) {
                val = `0${val}`;
            }
            output += `0x${val}` + "\t";
        }

        console.log(output); 
    }
}

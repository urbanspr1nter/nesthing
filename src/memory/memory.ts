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
        return this._memory[address & 0xFFFF];
    }

    public printDebug(startAddress: number, endAddress: number) {
        let output = '';
        for(let i = startAddress; i <= endAddress; i++) {
            if((i - startAddress) % 16 === 0) {
                output += '\n';
            }
            output += (this.get(i).toString(16) + ' ');
        }

        console.log(output);
    }
}

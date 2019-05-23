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

    public bits(): number[] {
        return this._memory;
    }

    public set = (address: number, value: number): void  => {
        this._memory[address & MaxMemoryAddress] = value & 0xFF;
    }

    public get = (address: number) => {
        return this._memory[address & MaxMemoryAddress] & 0xFF;
    }
}

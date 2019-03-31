export class OamMemory {
    private _memory: number[];

    constructor() {
        this._memory = [];
    }

    public set(address: number, data: number) {
        this._memory[address & 0xFF] = data & 0xFF;
    }

    public get(address: number) {
        return this._memory[address & 0xFF];
    }
}

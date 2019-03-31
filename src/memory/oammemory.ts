export class OamMemory {
    private _memory: number[];

    constructor() {
        this._memory = [];

        for(let i = 0; i <= 0xFF; i++) {
            this._memory[i] = 0x00;
        }
    }

    public set(address: number, data: number) {
        this._memory[address & 0xFF] = data & 0xFF;
    }

    public get(address: number) {
        return this._memory[address & 0xFF];
    }

    public printView() {
        let output = "";
        for(let i = 0; i <= 0xFF; i++) {
            if(i % 0x10 === 0) {
                let label = i.toString(16).toUpperCase();
                if(label.length < 2) {
                    label = `0${label}`;
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

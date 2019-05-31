export enum Buttons {
    A = 0,
    B = 1,
    Select = 2,
    Start = 3,
    Up = 4,
    Down = 5,
    Left = 6,
    Right = 7 
}

export class Controller {
    private _buttonMap: { [id: number]: boolean };
    private _strobe: number;
    private _index: number;

    constructor() {
        this._buttonMap = {
            0: false,
            1: false,
            2: false,
            3: false,
            4: false,
            5: false,
            6: false,
            7: false
        };
        this._strobe = 0;
        this._index = 0;
    }

    public setButtons = (map: { [id: number]: boolean }) => {
        this._buttonMap = map;
    }

    public write = (value: number) => {
        this._strobe = value;
        if((this._strobe & 1) === 1) {
            this._index = 0;
        }
    }

    public read = (): number => {
        let value = 0;

        if(this._index < 8 && this._buttonMap[this._index]) {
            value = 1;
        }
        this._index++;

        if((this._strobe & 1) === 1) {
            this._index = 0;
        }

        return value;
    }
}
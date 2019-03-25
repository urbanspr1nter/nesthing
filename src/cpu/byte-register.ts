import { Register } from './register.interface';

export class ByteRegister implements Register {
    private _value: number;

    constructor(value: number) {
        this._value = value;
    }

    public set(value: number): void {
        this._value = value;

        this._adjust();
    }

    public get(): number {
        return this._value;
    }

    private _adjust(): number {
        this._value = this._value & 0xFF;

        return this._value;
    } 
}

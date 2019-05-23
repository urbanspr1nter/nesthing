export class LogUtil {
    private _buffer: string[];
    private _flushInterval: number;

    constructor(flushInterval: number) {
        this._buffer = [];
        this._flushInterval = flushInterval;
    }

    public log(entry: string): string[] {
        if(this._buffer.length > this._flushInterval) {
            this._buffer = [];
        }
        this._buffer.push(entry);

        return this._buffer;
    }

    public entries() {
        return this._buffer;
    }

    private _flush(): void {
        this._buffer = [];
    }
}
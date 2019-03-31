import { IPpuActionItem } from './ppu.interface';

export class PpuActionQueue {
    private _queue: IPpuActionItem[];

    constructor() {
        this._queue = [];
    }

    enqueue(item: IPpuActionItem) {
        this._queue.push(item);
    }

    dequeue(): IPpuActionItem {
        return this._queue.shift();
    }

    empty(): Boolean {
        return this._queue.length === 0;
    }
}

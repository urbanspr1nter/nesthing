"use strict";
exports.__esModule = true;
var PpuActionQueue = /** @class */ (function () {
    function PpuActionQueue() {
        this._queue = [];
    }
    PpuActionQueue.prototype.enqueue = function (item) {
        this._queue.push(item);
    };
    PpuActionQueue.prototype.dequeue = function () {
        return this._queue.shift();
    };
    PpuActionQueue.prototype.empty = function () {
        return this._queue.length === 0;
    };
    return PpuActionQueue;
}());
exports.PpuActionQueue = PpuActionQueue;

"use strict";
exports.__esModule = true;
var LogUtil = /** @class */ (function () {
    function LogUtil(flushInterval) {
        this._buffer = [];
        this._flushInterval = flushInterval;
    }
    LogUtil.prototype.log = function (entry) {
        if (this._buffer.length > this._flushInterval) {
            this._buffer = [];
        }
        this._buffer.push(entry);
        return this._buffer;
    };
    Object.defineProperty(LogUtil.prototype, "entries", {
        get: function () {
            return this._buffer;
        },
        enumerable: true,
        configurable: true
    });
    LogUtil.prototype._flush = function () {
        this._buffer = [];
    };
    return LogUtil;
}());
exports.LogUtil = LogUtil;

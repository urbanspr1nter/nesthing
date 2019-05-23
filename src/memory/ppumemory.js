"use strict";
exports.__esModule = true;
var MaxMemoryAddress = 0x3FFF;
var PpuMemory = /** @class */ (function () {
    function PpuMemory() {
        var _this = this;
        this.set = function (address, value) {
            _this._memory[address & MaxMemoryAddress] = value & 0xFF;
        };
        this.get = function (address) {
            return _this._memory[address & MaxMemoryAddress] & 0xFF;
        };
        this._memory = [];
        // Blank out
        for (var i = 0x0000; i <= MaxMemoryAddress; i++) {
            this._memory[i] = 0xFF;
        }
    }
    PpuMemory.prototype.bits = function () {
        return this._memory;
    };
    return PpuMemory;
}());
exports.PpuMemory = PpuMemory;

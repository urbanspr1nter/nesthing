"use strict";
exports.__esModule = true;
var MaxMemoryAddress = 0x3FFF;
var PpuMemory = /** @class */ (function () {
    function PpuMemory() {
        this._memory = [];
        // Blank out
        for (var i = 0x0000; i <= MaxMemoryAddress; i++) {
            this.set(i, 0xFF);
        }
    }
    PpuMemory.prototype.set = function (address, value) {
        this._memory[address & MaxMemoryAddress] = value & 0xFF;
    };
    PpuMemory.prototype.get = function (address) {
        return this._memory[address] & 0xFF;
    };
    PpuMemory.prototype.printView = function () {
        var output = "";
        for (var i = 0; i <= MaxMemoryAddress; i++) {
            if (i % 0x10 === 0) {
                var label = i.toString(16).toUpperCase();
                var padding = 4 - label.length;
                for (var j = 0; j < padding; j++) {
                    label = '0' + label;
                }
                output += "\n" + label + ":\t\t";
            }
            var val = "" + this._memory[i].toString(16).toUpperCase();
            if (val.length < 2) {
                val = "0" + val;
            }
            output += "0x" + val + "\t";
        }
        console.log(output);
    };
    return PpuMemory;
}());
exports.PpuMemory = PpuMemory;

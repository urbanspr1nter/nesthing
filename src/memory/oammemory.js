"use strict";
exports.__esModule = true;
var OamMemory = /** @class */ (function () {
    function OamMemory() {
        this._memory = [];
        for (var i = 0; i <= 0xFF; i++) {
            this._memory[i] = 0x00;
        }
    }
    OamMemory.prototype.set = function (address, data) {
        this._memory[address & 0xFF] = data & 0xFF;
    };
    OamMemory.prototype.get = function (address) {
        return this._memory[address & 0xFF];
    };
    OamMemory.prototype.printView = function () {
        var output = "";
        for (var i = 0; i <= 0xFF; i++) {
            if (i % 0x10 === 0) {
                var label = i.toString(16).toUpperCase();
                if (label.length < 2) {
                    label = "0" + label;
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
    return OamMemory;
}());
exports.OamMemory = OamMemory;

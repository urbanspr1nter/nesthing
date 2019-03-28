"use strict";
exports.__esModule = true;
var DoubleByteRegister = /** @class */ (function () {
    function DoubleByteRegister(value) {
        this._value = value;
    }
    DoubleByteRegister.prototype.set = function (value) {
        this._value = value;
        this._adjust();
    };
    DoubleByteRegister.prototype.get = function () {
        return this._value;
    };
    DoubleByteRegister.prototype.add = function (operand) {
        this._value += operand;
        return this._adjust();
    };
    DoubleByteRegister.prototype.subtract = function (operand) {
        this._value -= operand;
        return this._adjust();
    };
    DoubleByteRegister.prototype._adjust = function () {
        this._value = this._value & 0xFFFF;
        return this._value;
    };
    return DoubleByteRegister;
}());
exports.DoubleByteRegister = DoubleByteRegister;

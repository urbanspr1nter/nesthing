"use strict";
exports.__esModule = true;
var ByteRegister = /** @class */ (function () {
    function ByteRegister(value) {
        this._value = value;
    }
    ByteRegister.prototype.set = function (value) {
        this._value = value;
        this._adjust();
    };
    ByteRegister.prototype.get = function () {
        return this._value;
    };
    ByteRegister.prototype._adjust = function () {
        this._value = this._value & 0xFF;
        return this._value;
    };
    return ByteRegister;
}());
exports.ByteRegister = ByteRegister;
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

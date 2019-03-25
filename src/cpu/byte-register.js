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

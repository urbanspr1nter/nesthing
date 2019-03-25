"use strict";
exports.__esModule = true;
var memory_1 = require("../memory/memory");
var cpu_1 = require("../cpu/cpu");
var fs = require("fs");
var Nes = /** @class */ (function () {
    function Nes() {
        this._log = [];
        this._memory = new memory_1.Memory();
        this._cpu = new cpu_1.Cpu(this._memory, this._log);
    }
    Nes.prototype.run = function () {
        var _this = this;
        this._cpu.powerUp();
        var romContents = fs.readFileSync('./nestest.nes');
        var address = 0xC000;
        romContents.forEach(function (value, index) {
            _this._memory.set(address, value);
            address++;
        });
        while (this._cpu.getCurrentCycles() <= 2070) {
            // fetch
            var opCode = this._memory.get(this._cpu.getPC());
            //console.log(opCode.toString(16));
            // decode, execute, wb
            this._cpu.handleOp(opCode);
        }
        for (var _i = 0, _a = this._log; _i < _a.length; _i++) {
            var entry = _a[_i];
            console.log(entry);
        }
    };
    return Nes;
}());
exports.Nes = Nes;

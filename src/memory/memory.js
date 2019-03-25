"use strict";
exports.__esModule = true;
var Memory = /** @class */ (function () {
    function Memory() {
        this._memory = [];
        // Blank out the memory
        for (var i = 0; i <= 0xFFFF; i++) {
            this.set(i, 0xFF);
        }
    }
    Memory.prototype.set = function (address, value) {
        // Mirrored at 0x0800 - 0x0FFF
        //  -> 0x800 - 0x0FFF
        //  -> 0x1000 - 0x17FF
        //  -> 0x1800 - 0x1FFF
        if (address >= 0x800 && address <= 0x0FFF) {
            this._memory[address & 0xFFFF] = value;
            this._memory[(address + 1 * 0x800) & 0xFFFF] = value;
            this._memory[(address + 2 * 0x800) & 0xFFFF] = value;
        }
        else if (address >= 0x1000 && address <= 0x17FF) {
            this._memory[(address - 1 * 0x800) & 0xFFFF] = value;
            this._memory[address & 0xFFFF] = value;
            this._memory[(address + 1 * 0x800) & 0xFFFF] = value;
        }
        else if (address >= 0x1800 && address <= 0x1FFF) {
            this._memory[(address - 2 * 0x800) & 0xFFFF] = value;
            this._memory[(address - 1 * 0x800) & 0xFFFF] = value;
            this._memory[address & 0xFFFF] = value;
        }
        else if (address >= 0x2000 && address <= 0x3FFF) {
            // PPU registers: 0x2000-0x2007
            // -> Mirrored: 0x2008-0x3FFF
            //  -> (Every 8 bytes)   
            this._memory[(0x20 << 8) | (address & 0x0007)] = value;
        }
        else {
            this._memory[address & 0xFFFF] = value;
        }
    };
    Memory.prototype.get = function (address) {
        if (address >= 0x2000 && address <= 0x3FFF) {
            return this._memory[(0x20 << 8) | (address & 0x0007)];
        }
        return this._memory[address & 0xFFFF];
    };
    Memory.prototype.printDebug = function (startAddress, endAddress) {
        var output = '';
        for (var i = startAddress; i <= endAddress; i++) {
            if ((i - startAddress) % 16 === 0) {
                output += '\n';
            }
            output += (this.get(i).toString(16) + ' ');
        }
        console.log(output);
    };
    return Memory;
}());
exports.Memory = Memory;

"use strict";
exports.__esModule = true;
var Memory = /** @class */ (function () {
    function Memory(ppu) {
        var _this = this;
        this.set = function (address, value) {
            // Mirrored at 0x0800 - 0x0FFF
            //  -> 0x800 - 0x0FFF
            //  -> 0x1000 - 0x17FF
            //  -> 0x1800 - 0x1FFF
            value = value & 0xFF;
            if (address >= 0x800 && address <= 0x0FFF) {
                _this._memory[address & 0xFFFF] = value;
                _this._memory[(address + 1 * 0x800) & 0xFFFF] = value;
                _this._memory[(address + 2 * 0x800) & 0xFFFF] = value;
            }
            else if (address >= 0x1000 && address <= 0x17FF) {
                _this._memory[(address - 1 * 0x800) & 0xFFFF] = value;
                _this._memory[address & 0xFFFF] = value;
                _this._memory[(address + 1 * 0x800) & 0xFFFF] = value;
            }
            else if (address >= 0x1800 && address <= 0x1FFF) {
                _this._memory[(address - 2 * 0x800) & 0xFFFF] = value;
                _this._memory[(address - 1 * 0x800) & 0xFFFF] = value;
                _this._memory[address & 0xFFFF] = value;
            }
            else if (address >= 0x2000 && address <= 0x3FFF) {
                // PPU registers
                var decodedAddress = (0x20 << 8) | (address & 0x0007);
                if (decodedAddress === 0x2000) {
                    _this._ppu.write$2000(value);
                }
                else if (decodedAddress === 0x2001) {
                    _this._ppu.write$2001(value);
                }
                else if (decodedAddress === 0x2006) {
                    _this._ppu.write$2006(value);
                }
                else if (decodedAddress === 0x2007) {
                    _this._ppu.write$2007(value);
                }
                else {
                    _this._memory[decodedAddress] = value;
                }
            }
            else {
                _this._memory[address & 0xFFFF] = value;
            }
        };
        this.get = function (address) {
            if (address >= 0x2000 && address <= 0x3FFF) {
                var decodedAddress = (0x20 << 8) | (address & 0x0007);
                if (decodedAddress === 0x2000) {
                    return _this._ppu.read$2000();
                }
                else if (decodedAddress === 0x2002) {
                    return _this._ppu.read$2002();
                }
                else if (decodedAddress === 0x2006) {
                    // Not available for reading!
                }
                else if (decodedAddress === 0x2007) {
                    return _this._ppu.read$2007();
                }
                else {
                    return _this._memory[decodedAddress];
                }
            }
            return _this._memory[address & 0xFFFF] & 0xFF;
        };
        this._memory = [];
        this._ppu = ppu;
        // Blank out the memory
        for (var i = 0; i <= 0xFFFF; i++) {
            this._memory[i] = 0xFF;
        }
    }
    Object.defineProperty(Memory.prototype, "bits", {
        get: function () {
            return this._memory;
        },
        enumerable: true,
        configurable: true
    });
    return Memory;
}());
exports.Memory = Memory;

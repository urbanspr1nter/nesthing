"use strict";
exports.__esModule = true;
/**
 * CPU MEMORY MAP
 *
 * $0000 - $07FF ($0800) - RAM
 * $0800 - $0FFF ($0800) - Mirror of RAM
 * $1000 - $17FF ($0800) - Mirror of RAM
 * $1800 - $1FFF ($0800) - Mirror of RAM
 * $2000 - $2007 ($0008) - PPU Registers
 * $2008 - $3FFF ($1FF8) - Mirror of PPU Registers
 * $4000 - $4017 ($0018) - APU / IO Registers
 * $4018 - $401F ($0008) - APU / IO Functionality Disabled
 * $4020 - $FFFF ($BFE0) - Cartridge space: PRG RAOM, PRG RAM, mapper registers
 */
var Memory = /** @class */ (function () {
    function Memory(ppu) {
        var _this = this;
        this.set = function (address, value) {
            value = value & 0xff;
            if (address < 0x2000) {
                _this._memory[address & 0x07ff] = value;
                _this._memory[(address | 0x0800) & 0x0fff] = value;
                _this._memory[(address | 0x1000) & 0x17ff] = value;
                _this._memory[(address | 0x1800) & 0x1fff] = value;
            }
            else if (address >= 0x2000 && address <= 0x3fff) {
                // PPU registers
                var decodedAddress = (0x20 << 8) | (address & 0x0007);
                if (decodedAddress === 0x2000) {
                    _this._ppu.write$2000(value);
                }
                else if (decodedAddress === 0x2001) {
                    _this._ppu.write$2001(value);
                }
                else if (decodedAddress === 0x2003) {
                    _this._ppu.write$2003(value);
                }
                else if (decodedAddress === 0x2004) {
                    _this._ppu.write$2004(value);
                }
                else if (decodedAddress === 0x2005) {
                    _this._ppu.write$2005(value);
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
            else if (address === 0x4014) {
                return _this._ppu.write$4014(value);
            }
            else {
                _this._memory[address & 0xffff] = value;
            }
        };
        this.get = function (address) {
            if (address < 0x2000) {
                return _this._memory[address & 0x07ff];
            }
            else if (address >= 0x2000 && address <= 0x3fff) {
                var decodedAddress = (0x20 << 8) | (address & 0x0007);
                if (decodedAddress === 0x2000) {
                    return _this._ppu.read$2000();
                }
                else if (decodedAddress === 0x2002) {
                    return _this._ppu.read$2002();
                }
                else if (decodedAddress === 0x2004) {
                    return _this._ppu.read$2004();
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
            return _this._memory[address & 0xffff] & 0xff;
        };
        this._memory = [];
        this._ppu = ppu;
        // Blank out the memory
        for (var i = 0; i <= 0xffff; i++) {
            this._memory[i] = 0xff;
        }
    }
    Memory.prototype.bits = function () {
        return this._memory;
    };
    return Memory;
}());
exports.Memory = Memory;

"use strict";
exports.__esModule = true;
var framebuffer_1 = require("../framebuffer/framebuffer");
var utils_1 = require("../utils/ui/utils");
var Ppu = /** @class */ (function () {
    function Ppu(ppuMemory) {
        this._frameBuffer = new framebuffer_1.FrameBuffer();
        this._cpuNmiRequested = false;
        this._ppuMemory = ppuMemory;
        this._scanlines = 0;
        this._cycles = 0;
        this._fineY = 0;
        this._coarseY = 0;
        this._tileLowByte = 0;
        this._tileHighByte = 0;
        this._v = 0;
        this._t = 0;
        this._w = false;
        this._pixelBits = [];
    }
    Ppu.prototype.vramAddress = function () {
        return this._v;
    };
    Ppu.prototype.tVramAddress = function () {
        return this._t;
    };
    Ppu.prototype.fineX = function () {
        return this._x;
    };
    Ppu.prototype.vramAddressWriteToggle = function () {
        return this._w;
    };
    /**
     * Gets the framebuffer
     */
    Ppu.prototype.frameBuffer = function () {
        return this._frameBuffer.buffer;
    };
    Ppu.prototype.getCycles = function () {
        return this._cycles;
    };
    Ppu.prototype.getScanlines = function () {
        return this._scanlines;
    };
    Ppu.prototype.write$2000 = function (dataByte) {
        this._regPPUCTRL_nt0 = dataByte & 0x01;
        this._regPPUCTRL_nt1 = dataByte & 0x02;
        this._regPPUCTRL_vramIncrement = (dataByte & 0x04) === 0x0 ? 1 : 32;
        this._regPPUCTRL_spritePatternTableBaseAddress =
            (dataByte & 0x08) === 0x0 ? 0x0 : 0x1000;
        this._regPPUCTRL_backgroundPatternTableBaseAddress =
            (dataByte & 0x10) === 0x0 ? 0x0 : 0x1000;
        this._regPPUCTRL_spriteSizeLarge = (dataByte & 0x20) === 0x0 ? false : true;
        this._regPPUCTRL_masterSlaveSelect =
            (dataByte & 0x40) === 0x0 ? false : true;
        this._regPPUCTRL_generateNmiAtVblankStart =
            (dataByte & 0x80) === 0x0 ? false : true;
        if (this._regPPUCTRL_generateNmiAtVblankStart && this._isVblank()) {
            this._cpuNmiRequested = true;
        }
    };
    Ppu.prototype.read$2000 = function () {
        var bit_0 = this._regPPUCTRL_nt0;
        var bit_1 = this._regPPUCTRL_nt1;
        var bit_2 = this._regPPUCTRL_vramIncrement === 1 ? 0 : 1;
        var bit_3 = this._regPPUCTRL_spritePatternTableBaseAddress === 0 ? 0 : 1;
        var bit_4 = this._regPPUCTRL_backgroundPatternTableBaseAddress === 0 ? 0 : 1;
        var bit_5 = this._regPPUCTRL_spriteSizeLarge ? 1 : 0;
        var bit_6 = this._regPPUCTRL_masterSlaveSelect ? 1 : 0;
        var bit_7 = this._regPPUCTRL_generateNmiAtVblankStart ? 1 : 0;
        return ((bit_7 << 7) |
            (bit_6 << 6) |
            (bit_5 << 5) |
            (bit_4 << 4) |
            (bit_3 << 3) |
            (bit_2 << 2) |
            (bit_1 << 1) |
            bit_0);
    };
    Ppu.prototype.write$2001 = function (dataByte) {
        this._regPPUMASK_greyscale = (dataByte & 0x01) === 0x01 ? true : false;
        this._regPPUMASK_showBgInLeftMost8pxOfScreen =
            (dataByte & 0x02) === 0x02 ? true : false;
        this._regPPUMASK_showSpritesLeftMost8pxOfScreen =
            (dataByte & 0x04) === 0x04 ? true : false;
        this._regPPUMASK_showBackground = (dataByte & 0x08) === 0x08 ? true : false;
        this._regPPUMASK_showSprites = (dataByte & 0x10) === 0x10 ? true : false;
        this._regPPUMASK_emphasizeRed = (dataByte & 0x20) === 0x20 ? true : false;
        this._regPPUMASK_emphasizeGreen = (dataByte & 0x40) === 0x40 ? true : false;
        this._regPPUMASK_emphasizeBlue = (dataByte & 0x80) === 0x80 ? true : false;
    };
    Ppu.prototype.read$2002 = function () {
        var bit_5 = this._regPPUSTATUS_spriteOverflow ? 1 : 0;
        var bit_6 = this._regPPUSTATUS_spriteHit ? 1 : 0;
        var bit_7 = this._regPPUSTATUS_vblankStarted ? 1 : 0;
        this._regPPUSTATUS_vblankStarted = false;
        this._w = false;
        return (bit_7 << 7) | (bit_6 << 6) | (bit_5 << 5);
    };
    Ppu.prototype.write$2002 = function (dataByte) {
        this._regPPUSTATUS_spriteOverflow =
            (dataByte & 0x20) === 0x20 ? true : false;
        this._regPPUSTATUS_spriteHit = (dataByte & 0x40) === 0x40 ? true : false;
        this._regPPUSTATUS_vblankStarted =
            (dataByte & 0x80) === 0x80 ? true : false;
    };
    Ppu.prototype.write$2005 = function (dataByte) {
        if (!this._w) {
            this._t = (this._t & 0xfffe0) | (dataByte >> 3);
            this._regPPUSCROLL_x = dataByte & 0x07;
            this._w = true;
        }
        else {
            this._t = (this._t & 0x8fff) | ((dataByte & 0x07) << 12);
            this._t = (this._t & 0xfc1f) | ((dataByte & 0xf8) << 2);
            this._w = false;
        }
    };
    Ppu.prototype.write$2006 = function (dataByte) {
        if (!this._w) {
            this._t = (this._t & 0x80ff) | ((dataByte & 0x3f) << 8);
            this._w = true;
        }
        else {
            this._t = (this._t & 0xff00) | dataByte;
            this._v = this._t;
            this._w = false;
        }
        /*
        if (!this._w) {
          this._t = dataByte;
          this._w = true;
        } else {
          this._v = ((this._t << 8) | dataByte) & 0x3fff;
          this._w = false;
        }*/
    };
    Ppu.prototype.write$2007 = function (dataByte) {
        this._ppuMemory.set(this._v, dataByte);
        this.incrementVramAddress();
    };
    Ppu.prototype.read$2007 = function () {
        var value = this._ppuMemory.get(this._v);
        if (this._v % 0x4000 < 0x3f00) {
            var bufferedData = this._ppuDataReadBuffer;
            this._ppuDataReadBuffer = value;
            value = bufferedData;
        }
        else {
            this._ppuDataReadBuffer = this._ppuMemory.get(this._v - 0x1000);
        }
        this.incrementVramAddress();
        return value;
        /*
        const result = this._ppuDataReadBuffer;
        this._ppuDataReadBuffer = this._ppuMemory.get(this._v);
    
        this.incrementVramAddress();
    
        return result;
        */
    };
    Ppu.prototype.incrementVramAddress = function () {
        this._v += this._regPPUCTRL_vramIncrement;
    };
    Ppu.prototype.cpuNmiRequested = function () {
        if (this._cpuNmiRequested) {
            this._cpuNmiRequested = false;
            return true;
        }
        return false;
    };
    Ppu.prototype._setVblank = function () {
        this._regPPUSTATUS_vblankStarted = true;
    };
    Ppu.prototype._clearVblank = function () {
        this._regPPUSTATUS_vblankStarted = false;
    };
    Ppu.prototype._isVblank = function () {
        return this._regPPUSTATUS_vblankStarted;
    };
    /**
     * An NMI can be PREVENTED if bit 7 of $2002 is off.
     *
     * Therefore, we only generate an NMI request to the CPU
     * IFF bit 7 of $2002 is ON.
     */
    Ppu.prototype._requestNmiIfNeeded = function () {
        this._cpuNmiRequested = this._regPPUCTRL_generateNmiAtVblankStart;
    };
    Ppu.prototype._fetchNametableByte = function () {
        var currentVramAddress = this._v;
        /*const ntAddress =
          getBaseNametableAddress(this.read$2000()) | (currentVramAddress & 0x0fff);*/
        var ntAddress = 0x2000 | (this._v & 0x0fff);
        this._ntByte = this._ppuMemory.get(ntAddress);
    };
    Ppu.prototype._fetchAttributeByte = function () {
        var attributeAddress = 0x23c0 |
            (this._v & 0x0c00) |
            ((this._v >> 4) & 0x38) |
            ((this._v >> 2) & 0x07);
        var shift = ((this._v >> 4) & 4) | (this._v & 2);
        this._attributeByte =
            ((this._ppuMemory.get(attributeAddress) >> shift) & 3) << 2;
    };
    Ppu.prototype._fetchTileLowByte = function () {
        var fineY = (this._v >> 12) & 7;
        var patternTableBaseAddress = this
            ._regPPUCTRL_backgroundPatternTableBaseAddress;
        var patternLowAddress = patternTableBaseAddress + 0x10 * this._ntByte + fineY;
        this._tileLowByte = this._ppuMemory.get(patternLowAddress);
    };
    Ppu.prototype._fetchTileHighByte = function () {
        var fineY = (this._v >> 12) & 7;
        var patternTableBaseAddress = this
            ._regPPUCTRL_backgroundPatternTableBaseAddress;
        var patternHighAddress = patternTableBaseAddress + 0x10 * this._ntByte + fineY + 8;
        this._tileHighByte = this._ppuMemory.get(patternHighAddress);
    };
    /**
     * After every 8 cycles for the PPU, the fetched Atrribute, Low Tile, and High Tile
     * bytes are stored and reloaded into the registers. The upper bits of the tile shift
     * registers are populated with this data. Meanwhile, the lower bits of the tile shift
     * registeres are being accessed for rendering during every cycle.
     */
    Ppu.prototype._storeTileData = function () {
        for (var i = 0; i < 8; i++) {
            var attributeByte = this._attributeByte;
            var lowBit = (this._tileLowByte & 0x80) >> 7;
            var highBit = (this._tileHighByte & 0x80) >> 7;
            this._tileLowByte <<= 1;
            this._tileHighByte <<= 1;
            this._pixelBits.push(attributeByte >> 3);
            this._pixelBits.push(attributeByte >> 2);
            this._pixelBits.push(highBit);
            this._pixelBits.push(lowBit);
        }
    };
    /**
     * Shift a title of 4 bits from the shift registers to form the background pixel needed
     * to render onto the screen. During this, we are processing the lower databytes from the
     * shift registers.
     */
    Ppu.prototype._renderPixel = function () {
        var x = this._cycles - 1;
        var y = this._scanlines;
        var attributeBits = (this._pixelBits[0] << 1) | this._pixelBits[1];
        var highBit = this._pixelBits[2];
        var lowBit = this._pixelBits[3];
        var paletteOffset = (highBit << 1) | lowBit;
        var basePaletteAddress = 0x3f00;
        switch (attributeBits) {
            case 0x0:
                basePaletteAddress = 0x3f01;
                break;
            case 0x1:
                basePaletteAddress = 0x3f05;
                break;
            case 0x2:
                basePaletteAddress = 0x3f09;
                break;
            case 0x3:
                basePaletteAddress = 0x3f0d;
                break;
        }
        var colorByte = this._ppuMemory.get(basePaletteAddress + (paletteOffset - 1));
        this._frameBuffer.draw(y, x, framebuffer_1.NesPpuPalette[utils_1.byteValue2HexString(colorByte)]);
    };
    Ppu.prototype._incrementX = function () {
        if ((this._v & 0x001f) === 31) {
            this._v &= 0xffe0; // wrap-back to 0.
            //this._v ^= 0x0400;
        }
        else {
            this._v++;
        }
    };
    Ppu.prototype._incrementY = function () {
        if ((this._v & 0x7000) !== 0x7000) {
            this._v += 0x1000;
        }
        else {
            this._v = this._v & 0x8fff;
            var y = (this._v & 0x3e0) >> 5;
            if (y === 29) {
                y = 0;
                // this._v ^= 0x0800;
            }
            else if (y === 31) {
                y = 0;
            }
            else {
                y++;
            }
            this._v = (this._v & 0xfc1f) | (y << 5);
        }
    };
    Ppu.prototype._copyX = function () {
        this._v = (this._v & 0xfbe0) | (this._t & 0x041f);
    };
    Ppu.prototype._copyY = function () {
        this._v = (this._v & 0x841f) | (this._t & 0x7be0);
    };
    Ppu.prototype._tick = function () {
        if (this._regPPUMASK_showBackground) {
            if (!this._evenFrame && this._scanlines === 261 && this._cycles === 339) {
                this._cycles = 0;
                this._scanlines = 0;
                this._frames++;
                if (this._frames % 2) {
                    this._evenFrame = true;
                }
                else {
                    this._evenFrame = false;
                }
                return;
            }
        }
        this._cycles++;
        if (this._cycles > 340) {
            this._scanlines++;
            this._cycles = 0;
            if (this._scanlines > 261) {
                this._scanlines = 0;
                this._frames++;
                if (this._frames % 2) {
                    this._evenFrame = true;
                }
                else {
                    this._evenFrame = false;
                }
            }
        }
    };
    Ppu.prototype.run = function () {
        this._tick();
        var isRenderingEnabled = this._regPPUMASK_showBackground;
        var isPrerenderLine = this._scanlines === 261;
        var isVisibleLine = this._scanlines < 240;
        var isRenderLine = isPrerenderLine || isVisibleLine;
        var isPrefetchCycle = this._cycles >= 321 && this._cycles <= 336;
        var isVisibleCycle = this._cycles >= 1 && this._cycles <= 256;
        var isFetchCycle = isPrefetchCycle || isVisibleCycle;
        if (isRenderingEnabled) {
            if (isVisibleLine && isVisibleCycle) {
                this._renderPixel();
            }
            if (isRenderLine && isFetchCycle) {
                this._pixelBits.shift();
                this._pixelBits.shift();
                this._pixelBits.shift();
                this._pixelBits.shift();
                switch (this._cycles % 8) {
                    case 1:
                        this._fetchNametableByte();
                        break;
                    case 3:
                        this._fetchAttributeByte();
                        break;
                    case 5:
                        this._fetchTileLowByte();
                        break;
                    case 7:
                        this._fetchTileHighByte();
                        break;
                    case 0:
                        this._storeTileData();
                        break;
                }
            }
            if (isPrerenderLine && this._cycles >= 280 && this._cycles <= 304) {
                this._copyY();
            }
            if (isRenderLine) {
                if (isFetchCycle && this._cycles % 8 === 0) {
                    this._incrementX();
                }
                if (this._cycles === 256) {
                    this._incrementY();
                }
                if (this._cycles === 257) {
                    this._copyX();
                }
            }
        }
        if (this._scanlines === 241 && this._cycles === 1) {
            this._setVblank();
            this._requestNmiIfNeeded();
        }
        if (isPrerenderLine && this._cycles === 1) {
            this._clearVblank();
        }
    };
    return Ppu;
}());
exports.Ppu = Ppu;

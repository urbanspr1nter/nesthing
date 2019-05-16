"use strict";
exports.__esModule = true;
var oammemory_1 = require("../memory/oammemory");
var ppu_helpers_1 = require("./ppu.helpers");
var framebuffer_1 = require("../framebuffer/framebuffer");
var utils_1 = require("../utils/ui/utils");
// PPUSTATUS (0x2002)
var PpuStatusBits;
(function (PpuStatusBits) {
    PpuStatusBits[PpuStatusBits["SpriteOverflow"] = 5] = "SpriteOverflow";
    PpuStatusBits[PpuStatusBits["SpriteZeroHit"] = 6] = "SpriteZeroHit";
    PpuStatusBits[PpuStatusBits["Vblank"] = 7] = "Vblank";
})(PpuStatusBits = exports.PpuStatusBits || (exports.PpuStatusBits = {}));
var Ppu = /** @class */ (function () {
    function Ppu(ppuMemory) {
        this._frameBuffer = new framebuffer_1.FrameBuffer();
        this._cpuNmiRequested = false;
        this._ppuMemory = ppuMemory;
        this._oamMemory = new oammemory_1.OamMemory();
        this._totalCycles = 0;
        this._scanlines = 0;
        this._cycles = 0;
        // this._regPPUSTATUS = 0;
        this._fineY = 0;
        this._coarseY = 0;
        this._tileLowByte = 0;
        this._tileHighByte = 0;
        this._tileData_0 = 0;
        this._tileData_1 = 0;
        this._v = 0;
        this._t = 0;
        this._w = false;
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
    Ppu.prototype.addPpuCyclesInRun = function () {
        this.addPpuCycle();
    };
    Ppu.prototype.addPpuCycle = function () {
        this._cycles++;
        if (this._cycles > 340) {
            this._scanlines++;
            this._cycles = 0;
            if (this._scanlines > 261) {
                this._scanlines = 0;
            }
        }
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
            this._t = dataByte;
            this._w = true;
        }
        else {
            this._v = ((this._t << 8) | dataByte) & 0x3fff;
            this._w = false;
        }
    };
    Ppu.prototype.write$2007 = function (dataByte) {
        this._ppuMemory.set(this._v, dataByte);
        this.incrementVramAddress();
    };
    Ppu.prototype.read$2007 = function () {
        var result = this._ppuDataReadBuffer;
        this._ppuDataReadBuffer = this._ppuMemory.get(this._v);
        this.incrementVramAddress();
        return result;
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
    Ppu.prototype._getPaletteAddress = function (basePaletteAddress, colorIndex) {
        return basePaletteAddress + (colorIndex - 1);
    };
    Ppu.prototype._getHorizontalTileDelta = function (nameTableAddress) {
        return (nameTableAddress & 0x3e) >> 5 % 2;
    };
    Ppu.prototype._getVerticalTileDelta = function (nameTableAddress) {
        return nameTableAddress & 0x1f;
    };
    /**
     * Converts an address from the name table to an attribute table address.
     * @param ntAddress Attribute table address
     */
    Ppu.prototype._convertNametableAddressToAttributeTableAddress = function (ntAddress) {
        // Nametable address: 0010 NNYY YYYX XXXX
        // Attribute Table Address: 0010 NN11 11YY YXXX
        var yBits = ntAddress & 0x03e0; // 0000 0011 1110 0000
        var xBits = ntAddress & 0x001f; // 0000 0000 0001 1111
        var ntBits = ntAddress & 0x0c00; // 0000 1100 0000 0000
        var base = 0x2000; // 0010 0000 0000 0000
        var mask = 0x03c0; // 0000 0011 1100 0000
        var topYBits = (yBits & 0x0380) >> 4; // 0000 0011 1000 0000 -> 0000 0000 0011 1000
        var topXBits = (xBits & 0x001c) >> 2; // 0000 0000 0001 1100 -> 0000 0000 0000 0111
        // Ex 0x2209
        //   0010 0000 0000 0000 (0x2000)
        // | 0000 0000 0000 0000 (NT BITS)
        // | 0000 0011 1100 0000 (MASK => 0x03C0)
        // | 0000 0000 0010 0000 (TOP Y)
        // | 0000 0000 0000 0010 (TOP X)
        // ------------------------
        // > 0010 0011 1110 0010 => 0x23E2
        var address = base | ntBits | mask | topYBits | topXBits;
        return address;
    };
    Ppu.prototype._fetchNametableByte = function () {
        var currentVramAddress = this._v;
        var ntAddress = ppu_helpers_1.getBaseNametableAddress(this.read$2000()) | (currentVramAddress & 0x0fff);
        this._ntByte = this._ppuMemory.get(ntAddress);
    };
    Ppu.prototype._fetchAttributeByte = function () {
        var currentVramAddress = this._v;
        /*
        const ntAddress =
          getBaseNametableAddress(this.read$2000()) | (currentVramAddress & 0x0fff);
        const attributeAddress = this._convertNametableAddressToAttributeTableAddress(
          ntAddress
        );*/
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
        var baseNtAddress = ppu_helpers_1.getBaseNametableAddress(this.read$2000()) | (this._v & 0x0fff);
        var patternLowAddress = baseNtAddress + 0x10 * this._ntByte + fineY;
        this._tileLowByte = this._ppuMemory.get(patternLowAddress);
    };
    Ppu.prototype._fetchTileHighByte = function () {
        var fineY = (this._v >> 12) & 7;
        var baseNtAddress = ppu_helpers_1.getBaseNametableAddress(this.read$2000()) | (this._v & 0x0fff);
        var patternHighAddress = baseNtAddress + 0x10 * this._ntByte + fineY + 8;
        this._tileHighByte = this._ppuMemory.get(patternHighAddress);
    };
    /*
    private _mergeTileBytesToPixelColorComponents(): ColorComponent[] {
      const mergedRowBits: number[] = this._mergeTileLowAndHighBytesToRowBits(
        this._tileLowByte,
        this._tileHighByte
      );
      const attributeByte: number = this._attributeByte;
  
      const ntAddress =
        getBaseNametableAddress(this._regPPUCTRL) | (this._vramAddress & 0x0fff);
      const hTileDelta = this._getHorizontalTileDelta(ntAddress);
      const vTileDelta = this._getVerticalTileDelta(ntAddress);
  
      const attributeGroupIndex = getAttributeGroupIndex(hTileDelta, vTileDelta);
  
      const basePaletteAddress = getBasePaletteAddress(
        attributeByte,
        attributeGroupIndex
      );
  
      const pixelColors: ColorComponent[] = [];
      for (let i = 0; i < mergedRowBits.length; i++) {
        const paletteAddress = this._getPaletteAddress(
          basePaletteAddress,
          mergedRowBits[i]
        );
        const colorByte = this._ppuMemory.get(paletteAddress);
        const colorComp = this._frameBuffer.getColor(colorByte);
        pixelColors.push(colorComp);
      }
  
      return pixelColors;
    }*/
    Ppu.prototype._storeTileData = function () {
        var data = 0x0;
        for (var i = 0; i < 8; i++) {
            var attributeByte = this._attributeByte;
            debugger;
            var lowBit = (this._tileLowByte & 0x80) >> 7;
            var highBit = (this._tileHighByte & 0x80) >> 6;
            this._tileLowByte <<= 1;
            this._tileHighByte <<= 1;
            data <<= 4;
            data |= attributeByte | lowBit | highBit;
        }
        if (!this._tileDataToggle) {
            this._tileData_0 |= data;
        }
        else {
            this._tileData_1 |= data;
        }
    };
    Ppu.prototype._renderPixel = function () {
        var x = this._cycles - 1;
        var y = this._scanlines;
        // First 32 bits are reserved for the first tiledata
        // AALH AALH AALH AALH AALH AALH
        var tileData = !this._tileDataToggle
            ? this._tileData_0
            : this._tileData_1;
        var pixel = (tileData >> ((7 - this._regPPUSCROLL_x) * 4)) & 0x0f;
        // Now need to obtain the palette and then reach for the color offset...
        // backgorund color:
        var colorByte = this._ppuMemory.get(0x3f00 + pixel);
        this._frameBuffer.draw(y, x, framebuffer_1.NesPpuPalette[utils_1.byteValue2HexString(colorByte)]);
    };
    /*
    private _mergeTileLowAndHighBytesToRowBits(
      lowByte: number,
      highByte: number
    ): number[] {
      let mask = 0x1;
  
      const bits: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
      for (let j = 0; j < 8; j++) {
        const lowBit = (lowByte & (mask << j)) > 0 ? 1 : 0;
        const highBit = (highByte & (mask << j)) > 0 ? 1 : 0;
  
        const mergedBits = (highBit << 1) | lowBit;
  
        bits[7 - j] = mergedBits;
      }
  
      return bits;
    }*/
    /*
    private _drawColorComponentsToFrameBuffer(colors: ColorComponent[]) {
      const ntAddress =
        getBaseNametableAddress(this._regPPUCTRL) | (this._vramAddress & 0x0fff);
      let fbTileRow = parseInt(((ntAddress % 0x2000) / 0x20).toString());
      let fbTileCol = parseInt(((ntAddress % 0x2000) % 0x20).toString());
  
      const fbCol = fbTileCol * 8;
      const fbRow = fbTileRow * 8 + this._fineY;
  
      let shift = 0;
      for (let k = fbCol; k < fbCol + 8; k++) {
        this._frameBuffer.draw(fbRow, k, colors[shift]);
        shift++;
      }
    }
  */
    Ppu.prototype._incrementX = function () {
        if ((this._v & 0x001f) === 31) {
            this._v &= 0xffe0; // wrap-back to 0.
        }
        else {
            this.incrementVramAddress();
        }
    };
    Ppu.prototype._incrementY = function () {
        if ((this._v & 0x7000) !== 0x7000) {
            // fine Y increment
            this._v += 0x1000;
        }
        else {
            this._v = this._v & 0x8fff;
            this._coarseY = (this._v & 0x3e0) >> 5;
            if (this._coarseY === 29) {
                this._coarseY = 0;
            }
            else if (this._coarseY === 31) {
                this._coarseY = 0;
            }
            else {
                this._coarseY++;
            }
            this._v = (this._v & 0xfc1f) | (this._coarseY << 5);
        }
        if (this._fineY < 7) {
            this._fineY++;
        }
        else {
            this._fineY = 0;
            this._coarseY++;
            if (this._coarseY > 29) {
                this._coarseY = 0;
                this._v = this._v += 32;
            }
        }
    };
    Ppu.prototype._copyX = function () {
        this._v = (this._v & 0xfbe0) | (this._t & 0x041f);
    };
    Ppu.prototype._copyY = function () {
        this._v = (this._v & 0x841f) | (this._t & 0x7be0);
    };
    Ppu.prototype.tick = function () {
        // add a cycle to the PPU
        this.addPpuCyclesInRun();
    };
    Ppu.prototype.run = function () {
        this.tick();
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
                if (!this._tileDataToggle) {
                    this._tileData_0 <<= 4;
                }
                else {
                    this._tileData_1 <<= 4;
                }
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
                    case 0:
                        this._storeTileData();
                        this._tileDataToggle = !this._tileDataToggle;
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

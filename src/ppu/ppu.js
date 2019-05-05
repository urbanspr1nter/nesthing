"use strict";
exports.__esModule = true;
var oammemory_1 = require("../memory/oammemory");
var ppu_helpers_1 = require("./ppu.helpers");
var ppu_interface_1 = require("./ppu.interface");
var framebuffer_1 = require("../framebuffer/framebuffer");
// Background Shift Registers
exports.TileShiftRegister1 = {
    HighByte: 0,
    LowByte: 0
};
exports.TileShiftRegister2 = {
    HighByte: 0,
    LowByte: 0
};
exports.PaletteShiftRegister1 = {
    Value: 0
};
exports.PaletteShiftRegister2 = {
    Value: 0
};
// PPUCTRL (0x2000)
var PpuCtrlBits;
(function (PpuCtrlBits) {
    PpuCtrlBits[PpuCtrlBits["NametableSelectLsb"] = 0] = "NametableSelectLsb";
    PpuCtrlBits[PpuCtrlBits["NametableSelectMsb"] = 1] = "NametableSelectMsb";
    PpuCtrlBits[PpuCtrlBits["Increment"] = 2] = "Increment";
    PpuCtrlBits[PpuCtrlBits["SpriteTileSelect"] = 3] = "SpriteTileSelect";
    PpuCtrlBits[PpuCtrlBits["BackgroundTileSelect"] = 4] = "BackgroundTileSelect";
    PpuCtrlBits[PpuCtrlBits["SpriteHeight"] = 5] = "SpriteHeight";
    PpuCtrlBits[PpuCtrlBits["MasterToggle"] = 6] = "MasterToggle";
    PpuCtrlBits[PpuCtrlBits["Vblank"] = 7] = "Vblank";
})(PpuCtrlBits = exports.PpuCtrlBits || (exports.PpuCtrlBits = {}));
;
// PPUMASK (0x2001)
var PpuMaskBits;
(function (PpuMaskBits) {
    PpuMaskBits[PpuMaskBits["Greyscale"] = 0] = "Greyscale";
    PpuMaskBits[PpuMaskBits["ShowBackgroundInLeftmost"] = 1] = "ShowBackgroundInLeftmost";
    PpuMaskBits[PpuMaskBits["ShowSpritesInLeftmost"] = 2] = "ShowSpritesInLeftmost";
    PpuMaskBits[PpuMaskBits["ShowBackground"] = 3] = "ShowBackground";
    PpuMaskBits[PpuMaskBits["ShowSprites"] = 4] = "ShowSprites";
    PpuMaskBits[PpuMaskBits["EmphasizeRed"] = 5] = "EmphasizeRed";
    PpuMaskBits[PpuMaskBits["EmphasizeGreen"] = 6] = "EmphasizeGreen";
    PpuMaskBits[PpuMaskBits["EmphasizeBlue"] = 7] = "EmphasizeBlue";
})(PpuMaskBits = exports.PpuMaskBits || (exports.PpuMaskBits = {}));
// PPUSTATUS (0x2002)
var PpuStatusBits;
(function (PpuStatusBits) {
    PpuStatusBits[PpuStatusBits["SpriteOverflow"] = 5] = "SpriteOverflow";
    PpuStatusBits[PpuStatusBits["SpriteZeroHit"] = 6] = "SpriteZeroHit";
    PpuStatusBits[PpuStatusBits["Vblank"] = 7] = "Vblank";
})(PpuStatusBits = exports.PpuStatusBits || (exports.PpuStatusBits = {}));
exports.IgnoredWritesBeforeWarmedUp = [
    ppu_interface_1.PpuRegister.PPUCTRL,
    ppu_interface_1.PpuRegister.PPUMASK,
    ppu_interface_1.PpuRegister.PPUSCROLL,
    ppu_interface_1.PpuRegister.PPUADDR
];
var Ppu = /** @class */ (function () {
    function Ppu(ppuMemory) {
        // this._initializeFrameBuffer();
        this._frameBuffer = new framebuffer_1.FrameBuffer();
        this._cpuNmiRequested = false;
        this._ppuMemory = ppuMemory;
        this._oamMemory = new oammemory_1.OamMemory();
        this._currentCyclesInRun = 0;
        this._totalCycles = 0;
        this._scanlines = -1;
        this._cycles = 0;
        this._vramAddress = 0;
        this._tVramAddress = 0;
        this._isSecondWrite = false;
        this._regPPUCTRL = 0;
        this._regPPUMASK = 0;
        this._regPPUSTATUS = 0;
    }
    Ppu.prototype.vramAddress = function () {
        return this._vramAddress;
    };
    /**
     * Gets the framebuffer
     */
    Ppu.prototype.frameBuffer = function () {
        return this._frameBuffer.buffer;
    };
    Ppu.prototype.addPpuCyclesInRun = function (ppuCycles) {
        this._currentCyclesInRun += ppuCycles;
        this.addPpuCycles(ppuCycles);
    };
    Ppu.prototype.addPpuCycles = function (cycles) {
        this._cycles += cycles;
        if (this._cycles >= 341) {
            this._scanlines++;
            if (this._scanlines === 261) {
                this._scanlines = -1;
            }
            var remaining = this._cycles - 341;
            this._cycles = remaining;
        }
    };
    Ppu.prototype.getCycles = function () {
        return this._cycles;
    };
    Ppu.prototype.getScanlines = function () {
        return this._scanlines;
    };
    Ppu.prototype.write$2000 = function (dataByte) {
        this._regPPUCTRL = dataByte & 0xFF;
        if (((this._regPPUCTRL & (0x1 << PpuCtrlBits.Vblank)) > 0x0)
            && this._isVblank()) {
            this._cpuNmiRequested = true;
        }
    };
    Ppu.prototype.write$2001 = function (dataByte) {
        this._regPPUMASK = dataByte & 0xFF;
    };
    Ppu.prototype.write$2002 = function (dataByte) {
        this._regPPUSTATUS = dataByte & 0xFF;
    };
    Ppu.prototype.write$2006 = function (dataByte) {
        if (!this._isSecondWrite) {
            this._tVramAddress = dataByte;
            this._isSecondWrite = true;
        }
        else {
            this._vramAddress = ((this._tVramAddress << 8) | dataByte) & 0x3FFF;
            this._isSecondWrite = false;
        }
    };
    Ppu.prototype.write$2007 = function (dataByte) {
        this._ppuMemory.set(this._vramAddress, dataByte);
        this.incrementVramAddress();
    };
    Ppu.prototype.read$2000 = function () {
        return this._regPPUCTRL;
    };
    Ppu.prototype.read$2002 = function () {
        var currentStatus = this._regPPUSTATUS;
        this._clearVblank();
        this._isSecondWrite = false;
        return currentStatus;
    };
    Ppu.prototype.read$2007 = function () {
        var result = this._ppuDataReadBuffer;
        this._ppuDataReadBuffer = this._ppuMemory.get(this._vramAddress);
        this.incrementVramAddress();
        return result;
    };
    Ppu.prototype.incrementVramAddress = function () {
        var vramIncrement = (this._regPPUCTRL & (0x1 << PpuCtrlBits.Increment)) > 0x0
            ? 32
            : 1;
        this._vramAddress += vramIncrement;
    };
    Ppu.prototype.cpuNmiRequested = function () {
        if (this._cpuNmiRequested) {
            this._cpuNmiRequested = false;
            return true;
        }
        return false;
    };
    Ppu.prototype._setVblank = function () {
        this._regPPUSTATUS = this._regPPUSTATUS | (0x1 << PpuStatusBits.Vblank);
    };
    Ppu.prototype._clearVblank = function () {
        this._regPPUSTATUS = this._regPPUSTATUS & ~(0x1 << PpuStatusBits.Vblank);
    };
    Ppu.prototype._isVblank = function () {
        return (this._regPPUSTATUS & (0x1 << PpuStatusBits.Vblank)) > 0x0;
    };
    /**
     * An NMI can be PREVENTED if bit 7 of $2002 is off.
     *
     * Therefore, we only generate an NMI request to the CPU
     * IFF bit 7 of $2002 is ON.
     */
    Ppu.prototype._requestNmiIfNeeded = function () {
        if ((this._regPPUCTRL & 0x80) > 0x0) {
            this._cpuNmiRequested = true;
        }
    };
    Ppu.prototype._mergeTileLowAndHighBytesToRowBits = function (lowByte, highByte) {
        var mask = 0x1;
        var bits = [0, 0, 0, 0, 0, 0, 0, 0];
        for (var j = 0; j < 8; j++) {
            var lowBit = (lowByte & (mask << j)) > 0 ? 1 : 0;
            var highBit = (highByte & (mask << j)) > 0 ? 1 : 0;
            var mergedBits = (highBit << 1) | lowBit;
            bits[7 - j] = mergedBits;
        }
        return bits;
    };
    Ppu.prototype._getPixelColorsForRowBits = function (nameTableAddress, rowBits) {
        // NT: 0010 NNYY YYYX XXXX
        //            || |||| ||||
        //            \____/ \___/
        //            Tile Y  Tile X
        // Example:
        //  Given a nametable address 0x2083:
        //  0010 0000 1000 0011
        //
        //  Tile Y = 0x00100 -> 4
        //  Tile X = 0x00011 -> 3
        //
        // Attribute byte is in following format: 3322 1100
        //
        // Now do Y % 2 and X % 2 and map to this table
        //
        // X | Y | Att Group
        // ------------------
        // 0 | 0 | 0
        // 1 | 0 | 1
        // 0 | 1 | 2
        // 1 | 1 | 3
        var attributeByteAddress = this._convertNametableAddressToAttributeTableAddress(nameTableAddress);
        var attributeByte = this._ppuMemory.get(attributeByteAddress);
        var hTileDelta = this._getHorizontalTileDelta(nameTableAddress);
        var vTileDelta = this._getVerticalTileDelta(nameTableAddress);
        var attributeGroupIndex = this._getAttributeGroupIndex(hTileDelta, vTileDelta);
        var basePaletteAddress = this._getBasePaletteAddress(attributeByte, attributeGroupIndex);
        var pixelColors = [];
        for (var i = 0; i < rowBits.length; i++) {
            var paletteAddress = this._getPaletteAddress(basePaletteAddress, rowBits[i]);
            var colorByte = this._ppuMemory.get(paletteAddress);
            var colorComp = this._frameBuffer.getColor(colorByte);
            pixelColors.push(colorComp);
        }
        return pixelColors;
    };
    Ppu.prototype._getBasePaletteAddress = function (attributeByte, attributeGroup) {
        // Attribute byte is in following format: 3322 1100
        //
        // Now do Y % 2 and X % 2 and map to this table
        //
        // X | Y | Att Group
        // ------------------
        // 0 | 0 | 0
        // 1 | 0 | 1
        // 0 | 1 | 2
        // 1 | 1 | 3
        var result = ((attributeByte) & (0x3 << (attributeGroup * 2))) >> (attributeGroup * 2);
        switch (result) {
            case 0:
                return 0x3F01;
            case 1:
                return 0x3F05;
            case 2:
                return 0x3F09;
            case 3:
                return 0x3F0D;
        }
        // Universal background
        return 0x3F00;
    };
    Ppu.prototype._getPaletteAddress = function (basePaletteAddress, colorIndex) {
        return basePaletteAddress + (colorIndex - 1);
    };
    Ppu.prototype._getHorizontalTileDelta = function (nameTableAddress) {
        return (nameTableAddress & 0x3E) >> 5 % 2;
    };
    Ppu.prototype._getVerticalTileDelta = function (nameTableAddress) {
        return (nameTableAddress & 0x1F);
    };
    Ppu.prototype._getAttributeGroupIndex = function (hTileDelta, vTileDelta) {
        var x = hTileDelta % 2;
        var y = vTileDelta % 2;
        if (x === 0 && y == 0) {
            return 0;
        }
        else if (x === 1 && y === 0) {
            return 1;
        }
        else if (x === 0 && y === 1) {
            return 2;
        }
        else if (x === 1 && y === 1) {
            return 3;
        }
        return 0;
    };
    Ppu.prototype.fetchPatternTileBytes = function (patternIndex, nametableAddress) {
        var baseAddress = (this._regPPUCTRL & (0x1 << PpuCtrlBits.BackgroundTileSelect)) === 0
            ? 0x0000 : 0x1000;
        var patternStartAddress = baseAddress + (0x10 * patternIndex);
        var fbTileRow = parseInt(((nametableAddress % 0x2000) / 0x20).toString());
        var fbTileCol = parseInt(((nametableAddress % 0x2000) % 0x20).toString());
        for (var i = patternStartAddress; i < patternStartAddress + 8; i++) {
            var currPatternLow = this._ppuMemory.get(i);
            var currPatternHigh = this._ppuMemory.get(i + 8);
            var rowBits = this._mergeTileLowAndHighBytesToRowBits(currPatternLow, currPatternHigh);
            var frameBufferRowBits = this._getPixelColorsForRowBits(nametableAddress, rowBits);
            // NOW we have a ROW BYTE. 
            //  1. Get the current row in the frame buffer. We know row for the current tile being processed.
            //  2. Translate the tile ROW to the startin row coordinate in the frame buffer
            var fbRow = (fbTileRow * 8) + (i - patternStartAddress);
            //  3. Find the column to begin dropping the bits.
            var fbCol = fbTileCol * 8;
            //  4. Start shift at 0;
            var shift = 0;
            for (var k = fbCol; k < fbCol + 8; k++) {
                this._frameBuffer.draw(fbRow, k, frameBufferRowBits[shift]);
                shift++;
            }
        }
    };
    /**
     * Converts an address from the name table to an attribute table address.
     * @param ntAddress Attribute table address
     */
    Ppu.prototype._convertNametableAddressToAttributeTableAddress = function (ntAddress) {
        // Nametable address: 0010 NNYY YYYX XXXX
        // Attribute Table Address: 0010 NN11 11YY YXXX
        var yBits = (ntAddress & 0x03E0); // 0000 0011 1110 0000
        var xBits = (ntAddress & 0x001F); // 0000 0000 0001 1111
        var ntBits = (ntAddress & 0x0C00); // 0000 1100 0000 0000
        var base = 0x2000; // 0010 0000 0000 0000
        var mask = 0x03C0; // 0000 0011 1100 0000
        var topYBits = (yBits & 0x0380) >> 4; // 0000 0011 1000 0000 -> 0000 0000 0011 1000
        var topXBits = (xBits & 0x001C) >> 2; // 0000 0000 0001 1100 -> 0000 0000 0000 0111 
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
    Ppu.prototype.run = function () {
        this._currentCyclesInRun = 0;
        if (this._scanlines === -1) {
            if (this._cycles === 0) {
                // Idle Cycle
                this.addPpuCyclesInRun(1);
            }
            else if (this._cycles === 1) {
                this._clearVblank();
                this.addPpuCyclesInRun(1);
            }
            else {
                this.addPpuCyclesInRun(1);
            }
        }
        else if (this._scanlines >= 0 && this._scanlines <= 239) {
            if (this._cycles == 0) {
                this.addPpuCyclesInRun(1);
            }
            else if (this._cycles >= 1 && this._cycles <= 256) {
                /**
                 * Here's how to actually process these cycles:
                 *
                 * Note that the vramAddress here is now set to the start of the nametable
                 * base address. The CPU can only manipulate the VRAM address during VBLANK.
                 *
                 * That is why it is not good to actually write to $2006 when the PPU is not
                 * in the VBLANK state because it can potentially disrupt this section of the
                 * routine.
                 *
                 * Anyway, to process the nametable and fill our frame-buffer, we will need to
                 * use 8 cycles per pattern tile in which we want to render.
                 *
                 * Then we do:
                 *
                 * 1. Fetch the pattern tile index at the nametable location. (2 cycles)
                 * 2. Calculate the attribute address by converting the
                 *    nametable location to attribute location. (2 cycles)
                 * 3. Increment the VRAM address within the same row.
                 * 4. Fetch the current low-byte of the pattern tile (8x1 row) (2 cycles)
                 * 5. Fetch the current high-byte of the pattern tile (8x1 row) (2 cycles)
                 *
                 * As we can see, each "row" of the pattern tile is processed in 8 cycles.
                 *
                 * Therefore, 32 different pattern tiles are evaluated in a per row basis for
                 * each scan line. (256 cycles / 8 cycles per row) = 32.
                 *
                 * Meaning, that for each scan line, it will visit that same pattern tile 8 times
                 * due to pattern tiles being 8x8 pixels.
                 */
                // Fetch NT Byte
                var ntByteIndex = (this._vramAddress & 0xFFF) + ppu_helpers_1.getBaseNametableAddress(this._regPPUCTRL);
                // console.log(`NT BYTE INDEX: ${ntByteIndex.toString(16).toUpperCase()}`);
                //this.incrementVramAddress();
                this.addPpuCyclesInRun(8);
            }
            else if (this._cycles >= 257 && this._cycles <= 320) {
                // Garbage fetch
                this.addPpuCyclesInRun(2);
            }
            else if (this._cycles >= 321 && this._cycles <= 336) {
                this.addPpuCyclesInRun(2);
            }
            else if (this._cycles >= 337 && this._cycles <= 340) {
                this.addPpuCyclesInRun(1);
            }
        }
        else if (this._scanlines === 240) {
            this.addPpuCyclesInRun(1);
        }
        else if (this._scanlines >= 241 && this._scanlines <= 260) {
            if (this._scanlines === 241 && this._cycles === 0) {
                // Idle cycle.
                this.addPpuCyclesInRun(1);
            }
            else if (this._scanlines === 241 && this._cycles === 1) {
                this._setVblank();
                this._requestNmiIfNeeded();
                this.addPpuCyclesInRun(1);
            }
            else {
                this.addPpuCyclesInRun(1);
            }
        }
        return this._currentCyclesInRun;
    };
    return Ppu;
}());
exports.Ppu = Ppu;

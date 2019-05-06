"use strict";
exports.__esModule = true;
var oammemory_1 = require("../memory/oammemory");
var ppu_helpers_1 = require("./ppu.helpers");
var ppu_interface_1 = require("./ppu.interface");
var framebuffer_1 = require("../framebuffer/framebuffer");
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
        this._fineY = 0;
        this._coarseX = 0;
        this._coarseY = 0;
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
        this._regPPUCTRL = dataByte & 0xff;
        if ((this._regPPUCTRL & (0x1 << PpuCtrlBits.Vblank)) > 0x0 &&
            this._isVblank()) {
            this._cpuNmiRequested = true;
        }
    };
    Ppu.prototype.write$2001 = function (dataByte) {
        this._regPPUMASK = dataByte & 0xff;
    };
    Ppu.prototype.write$2002 = function (dataByte) {
        this._regPPUSTATUS = dataByte & 0xff;
    };
    Ppu.prototype.write$2006 = function (dataByte) {
        if (!this._isSecondWrite) {
            this._tVramAddress = dataByte;
            this._isSecondWrite = true;
        }
        else {
            this._vramAddress = ((this._tVramAddress << 8) | dataByte) & 0x3fff;
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
        var vramIncrement = (this._regPPUCTRL & (0x1 << PpuCtrlBits.Increment)) > 0x0 ? 32 : 1;
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
        var currentVramAddress = this._vramAddress;
        var ntAddress = ppu_helpers_1.getBaseNametableAddress(this._regPPUCTRL) | (currentVramAddress & 0x0fff);
        this._ntByte = this._ppuMemory.get(ntAddress);
    };
    Ppu.prototype._fetchAttributeByte = function () {
        var currentVramAddress = this._vramAddress;
        var ntAddress = ppu_helpers_1.getBaseNametableAddress(this._regPPUCTRL) | (currentVramAddress & 0x0fff);
        var attributeAddress = this._convertNametableAddressToAttributeTableAddress(ntAddress);
        this._attributeByte = this._ppuMemory.get(attributeAddress);
    };
    Ppu.prototype._fetchTileLowByte = function () {
        var baseNtAddress = ppu_helpers_1.getBaseNametableAddress(this._regPPUCTRL) | (this._vramAddress & 0x0fff);
        var patternLowAddress = baseNtAddress + 0x10 * this._ntByte + this._fineY;
        this._tileLowByte = this._ppuMemory.get(patternLowAddress);
    };
    Ppu.prototype._fetchTileHighByte = function () {
        var baseNtAddress = ppu_helpers_1.getBaseNametableAddress(this._regPPUCTRL) | (this._vramAddress & 0x0fff);
        var patternHighAddress = baseNtAddress + 0x10 * this._ntByte + this._fineY + 8;
        this._tileHighByte = this._ppuMemory.get(patternHighAddress);
    };
    Ppu.prototype._mergeTileBytesToPixelColorComponents = function () {
        var mergedRowBits = this._mergeTileLowAndHighBytesToRowBits(this._tileLowByte, this._tileHighByte);
        var attributeByte = this._attributeByte;
        var ntAddress = ppu_helpers_1.getBaseNametableAddress(this._regPPUCTRL) | (this._vramAddress & 0x0fff);
        var hTileDelta = this._getHorizontalTileDelta(ntAddress);
        var vTileDelta = this._getVerticalTileDelta(ntAddress);
        var attributeGroupIndex = ppu_helpers_1.getAttributeGroupIndex(hTileDelta, vTileDelta);
        var basePaletteAddress = ppu_helpers_1.getBasePaletteAddress(attributeByte, attributeGroupIndex);
        var pixelColors = [];
        for (var i = 0; i < mergedRowBits.length; i++) {
            var paletteAddress = this._getPaletteAddress(basePaletteAddress, mergedRowBits[i]);
            var colorByte = this._ppuMemory.get(paletteAddress);
            var colorComp = this._frameBuffer.getColor(colorByte);
            pixelColors.push(colorComp);
        }
        return pixelColors;
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
    Ppu.prototype._drawColorComponentsToFrameBuffer = function (colors) {
        var ntAddress = ppu_helpers_1.getBaseNametableAddress(this._regPPUCTRL) | (this._vramAddress & 0x0fff);
        var fbTileRow = parseInt(((ntAddress % 0x2000) / 0x20).toString());
        var fbTileCol = parseInt(((ntAddress % 0x2000) % 0x20).toString());
        var fbCol = fbTileCol * 8;
        var fbRow = fbTileRow * 8 + this._fineY;
        var shift = 0;
        for (var k = fbCol; k < fbCol + 8; k++) {
            this._frameBuffer.draw(fbRow, k, colors[shift]);
            shift++;
        }
    };
    Ppu.prototype._incrementX = function () {
        if ((this._vramAddress & 0x001f) === 31) {
            this._vramAddress &= 0xffe0; // wrap-back to 0.
        }
        else {
            this.incrementVramAddress();
            this._coarseX++;
        }
    };
    Ppu.prototype._incrementY = function () {
        if (this._fineY < 7) {
            this._fineY++;
        }
        else {
            this._fineY = 0;
            this._coarseY++;
            if (this._coarseY > 29) {
                this._coarseY = 0;
            }
            this._vramAddress = (this._vramAddress & 0xfc1f) | (this._coarseY << 5);
        }
    };
    Ppu.prototype._adjustXandY = function () {
        if (this._cycles % 8 === 0) {
            this._incrementX();
        }
        if (this._coarseX >= 32) {
            this._incrementY();
        }
    };
    Ppu.prototype.tick = function () {
        // add a cycle to the PPU
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
                // FIXME: HACKKKKK!!!!
                this._vramAddress = 0x2000;
                this.addPpuCyclesInRun(1);
            }
            else if (this._cycles >= 280 && this._cycles <= 304) {
                // this._vramAddress =
                // (this._vramAddress & 0xfbe0) | (this._tVramAddress & 0x041f);
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
                debugger;
                switch (this._cycles % 8) {
                    case 1:
                        this._fetchNametableByte();
                        this.addPpuCyclesInRun(2);
                        break;
                    case 3:
                        this._fetchAttributeByte();
                        this.addPpuCyclesInRun(2);
                        break;
                    case 5:
                        this._fetchTileLowByte();
                        this.addPpuCyclesInRun(2);
                        break;
                    case 7:
                        this._fetchTileHighByte();
                        this.addPpuCyclesInRun(2);
                        var rowColorComponents = this._mergeTileBytesToPixelColorComponents();
                        this._drawColorComponentsToFrameBuffer(rowColorComponents);
                        break;
                }
                this._adjustXandY();
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

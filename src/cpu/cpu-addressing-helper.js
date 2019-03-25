"use strict";
exports.__esModule = true;
var CpuAddressingHelper = /** @class */ (function () {
    function CpuAddressingHelper(memory) {
        this._memory = memory;
    }
    /**
     * Gets the immediate value. Effectively a pass-through.
     *
     * @param regPC Effective value at the PC address, 8 bits wide.
     * @returns effectiveAddress The 8 bits wide value stored in the PC location.
     */
    CpuAddressingHelper.prototype.atImmediate = function (regPC) {
        return regPC.get();
    };
    /**
     * Gets the absolute effective address.
     *
     * @param regPC The current PC
     * @returns effectiveAddress The 16 bits wide effective address.
     */
    CpuAddressingHelper.prototype.atAbsolute = function (regPC) {
        var lowByte = this._memory.get(regPC.get());
        var highByte = this._memory.get(regPC.get() + 1);
        var effectiveAddress = (highByte << 8) | lowByte;
        return effectiveAddress;
    };
    CpuAddressingHelper.prototype.atAbsoluteIndirect = function (regPC) {
        var absoluteAddress = this.atAbsolute(regPC);
        var effectiveLow = this._memory.get(absoluteAddress);
        var effectiveHigh = this._memory.get(absoluteAddress + 1);
        var effectiveAddress = (effectiveHigh << 8) | effectiveLow;
        return effectiveAddress;
    };
    /**
     * Gets the direct page effective address.
     *
     * @param regPC The current PC
     * @returns effectiveAddress The 8 bits wide effective address.
     */
    CpuAddressingHelper.prototype.atDirectPage = function (regPC) {
        var lowByte = this._memory.get(regPC.get());
        var effectiveAddress = lowByte;
        return effectiveAddress;
    };
    /**
     * Gets the absolute indexed, x effective address.
     *
     * 1) Get the 2 bytes pointed by the PC in memory. This is base address.
     * 2) Add the base address and X value together to form the effective address.
     *
     * @param regPC The current PC
     * @param x The current X
     * @returns effectiveAddress, the 16 bits wide effective address
     */
    CpuAddressingHelper.prototype.atAbsoluteIndexedX = function (regPC, x) {
        var baseAddress = this.atAbsolute(regPC);
        var effectiveAddress = baseAddress + x.get();
        return effectiveAddress;
    };
    /**
     * Gets the absolute indexed, y effective address.
     *
     * @param regPC The current PC
     * @param y The current Y
     * @returns effectiveAddress, the 16 bits wide effective address
     */
    CpuAddressingHelper.prototype.atAbsoluteIndexedY = function (regPC, y) {
        var baseAddress = this.atAbsolute(regPC);
        var effectiveAddress = baseAddress + y.get();
        return effectiveAddress;
    };
    /**
     * Gets the direct page indexed, x effective address.
     *
     * The effective address is a wrap-around of the sum
     * of the direct page base address, and x-value.
     *
     * @param regPC The current PC
     * @param x The current X
     * @returns effectiveAddress the 8 bits wide effective address
     */
    CpuAddressingHelper.prototype.atDirectPageIndexedX = function (regPC, x) {
        var baseAddress = this.atDirectPage(regPC);
        var effectiveAddress = (baseAddress + x.get()) & 0xFF;
        return effectiveAddress;
    };
    /**
     * Gets the direct page indexed, y effective address.
     *
     * The effective address is a wrap-around of the sum
     * of the direct page base address, and x-value.
     *
     * @param regPC The current PC
     * @param x The current X
     * @returns effectiveAddress the 8 bits wide effective address
     */
    CpuAddressingHelper.prototype.atDirectPageIndexedY = function (regPC, y) {
        var baseAddress = this.atDirectPage(regPC);
        var effectiveAddress = (baseAddress + y.get()) & 0xFF;
        return effectiveAddress;
    };
    /**
     * 1) Get the byte pointed by PC in memory. This is the base low byte
     * 2) Take the base low byte and add X --> this is the base low byte (wrap)
     * 3) Take the base low byte and add X and add 1 --> this is the base high byte (wrap)
     * 4) Get the address by combining 2, 3.
     * 5) Effective address is the 2 bytes in memory pointed by (4).
     *
     * @param regPC The current PC
     * @param x The current X
     */
    CpuAddressingHelper.prototype.atDirectPageIndexedIndirectX = function (regPC, x) {
        var baseLowByte = this.atDirectPage(regPC);
        var indirectLow = (baseLowByte + x.get()) & 0xFF;
        var indirectHigh = (indirectLow + 1);
        var baseAddress = (indirectHigh << 8) | (indirectLow);
        var effectiveLow = this._memory.get(indirectLow);
        var effectiveHigh = this._memory.get(indirectHigh);
        var effectiveAddress = (effectiveHigh << 8) | effectiveLow;
        return effectiveAddress;
    };
    /**
     * Gets the Direct Page, Indirect Indexed Y Address.
     *
     * @param regPC The current PC
     * @param y The current Y
     */
    CpuAddressingHelper.prototype.atDirectPageIndirectIndexedY = function (regPC, y) {
        var baseLowByte = this.atDirectPage(regPC);
        var indirectLow = this._memory.get(baseLowByte);
        var indirectHigh = this._memory.get(baseLowByte + 1);
        var effectiveLow = (indirectLow + y.get()) & 0xFF;
        var carry = (indirectLow + y.get()) > 255 ? 1 : 0;
        var effectiveHigh = (indirectHigh) + (carry);
        var effectiveAddress = effectiveHigh << 8 | effectiveLow;
        return effectiveAddress;
    };
    CpuAddressingHelper.prototype.crossesPageBoundaryAtAbsoluteIndexedX = function (regPC, x) {
        var baseAddress = this.atAbsolute(regPC);
        var effectiveAddress = baseAddress + x.get();
        if ((effectiveAddress & 0xFF00) !== (baseAddress & 0xFF00)) {
            return true;
        }
        else {
            return false;
        }
    };
    CpuAddressingHelper.prototype.crossesPageBoundaryAtAbsoluteIndexedY = function (regPC, y) {
        var baseAddress = this.atAbsolute(regPC);
        var effectiveAddress = baseAddress + y.get();
        if ((effectiveAddress & 0xFF00) !== (baseAddress & 0xFF00)) {
            return true;
        }
        else {
            return false;
        }
    };
    /**
     * Utility Methd to check if a page boundary has been crossed
     * @param regPC
     * @param y
     */
    CpuAddressingHelper.prototype.crossesPageBoundaryAtDirectPageIndirectIndexedY = function (regPC, y) {
        var baseLowByte = this.atDirectPage(regPC);
        var indirectLow = this._memory.get(baseLowByte);
        return (indirectLow + y.get()) > 255 ? 1 : 0;
    };
    return CpuAddressingHelper;
}());
exports.CpuAddressingHelper = CpuAddressingHelper;

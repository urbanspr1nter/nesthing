"use strict";
exports.__esModule = true;
var byte_register_1 = require("./byte-register");
var double_byte_register_1 = require("./double-byte-register");
var cpu_interface_1 = require("./cpu.interface");
var cpu_addressing_helper_1 = require("./cpu-addressing-helper");
var Cpu = /** @class */ (function () {
    function Cpu(memory, logger) {
        this._dbg = true;
        this._currentCycles = 0;
        this._logger = logger;
        this._memory = memory;
        this._addressingHelper = new cpu_addressing_helper_1.CpuAddressingHelper(this._memory);
        this._regA = new byte_register_1.ByteRegister(0x00);
        this._regX = new byte_register_1.ByteRegister(0x00);
        this._regY = new byte_register_1.ByteRegister(0x00);
        this._regPC = new double_byte_register_1.DoubleByteRegister(0x00);
        this._regSP = new byte_register_1.ByteRegister(0x00);
        this._regP = new byte_register_1.ByteRegister(0x00);
        this._interrupt = cpu_interface_1.InterruptRequestType.None;
        this._stallCycles = 0;
    }
    Cpu.prototype.setStallCycles = function (cycles) {
        this._stallCycles = cycles;
    };
    Cpu.prototype.stallCycles = function () {
        return this._stallCycles;
    };
    Cpu.prototype.totalCycles = function () {
        return this._currentCycles;
    };
    Cpu.prototype.debugMode = function (value) {
        this._dbg = value;
    };
    Cpu.prototype._memWrite = function (address, data) {
        this._memory.set(address, data);
    };
    Cpu.prototype._memRead = function (address) {
        return this._memory.get(address);
    };
    Cpu.prototype.getLogEntry = function (opcode) {
        var formattedOpcode = "" + opcode.toString(16).toUpperCase();
        if (formattedOpcode.length < 2) {
            formattedOpcode = "0" + formattedOpcode;
        }
        var output = "";
        output = this.getPcLog() + "  " + formattedOpcode + " " + this.getByteLookAhead(cpu_interface_1.OpAddressingMode[opcode]);
        var spaces = 16 - output.length;
        for (var i = 0; i < spaces; i++) {
            output += " ";
        }
        output = "" + output + cpu_interface_1.OpLabel[opcode] + " " + this.getAddressString(cpu_interface_1.OpAddressingMode[opcode]);
        spaces = 48 - output.length;
        for (var i = 0; i < spaces; i++) {
            output += " ";
        }
        output += " ";
        output += this.getRegisterLog() + " " + 
        /*this.getPpuLog()*/ "" + " " + this.getCpuCycleLog();
        return output;
    };
    Cpu.prototype.getAddressString = function (addressingMode) {
        var byteString = "";
        switch (addressingMode) {
            case cpu_interface_1.AddressingModes.Immediate:
                var data = this._memRead(this._regPC.get() + 1)
                    .toString(16)
                    .toUpperCase();
                if (data.length < 2) {
                    data = "0" + data;
                }
                byteString = "#$" + data;
                break;
            case cpu_interface_1.AddressingModes.DirectPage:
                byteString = "" + this._memRead(this._regPC.get() + 1)
                    .toString(16)
                    .toUpperCase();
                if (byteString.length < 2) {
                    byteString = "0" + byteString;
                }
                byteString = "$" + byteString;
                break;
            case cpu_interface_1.AddressingModes.Accumulator:
                byteString = "A";
                break;
            case cpu_interface_1.AddressingModes.Absolute:
            case cpu_interface_1.AddressingModes.AbsoluteIndirect:
                var lowByte = this._memRead(this._regPC.get() + 1)
                    .toString(16)
                    .toUpperCase();
                if (lowByte.length < 2) {
                    lowByte = "0" + lowByte;
                }
                var highByte = this._memRead(this._regPC.get() + 2)
                    .toString(16)
                    .toUpperCase();
                if (highByte.length < 2) {
                    highByte = "0" + highByte + ";";
                }
                byteString = "$" + highByte + lowByte;
                break;
            case cpu_interface_1.AddressingModes.Relative:
                var displacement = this._memRead(this._regPC.get() + 1);
                if (displacement >= 0x80) {
                    displacement = -(0xff - displacement + 1);
                }
                var final = this._regPC.get() + 2 + displacement;
                byteString = "$" + final.toString(16).toUpperCase();
                break;
            case cpu_interface_1.AddressingModes.Implicit:
                byteString = "";
                break;
        }
        return byteString;
    };
    Cpu.prototype.getPcLog = function () {
        var currentPC = this._regPC.get();
        var xformedPC = currentPC.toString(16).toUpperCase();
        if (xformedPC.length < 4) {
            var difference = 4 - xformedPC.length;
            var paddingPC = "";
            for (var i = 0; i < difference; i++) {
                paddingPC += "0";
            }
            xformedPC = paddingPC + xformedPC;
        }
        return xformedPC;
    };
    Cpu.prototype.getByteLookAhead = function (addressingMode) {
        switch (addressingMode) {
            case cpu_interface_1.AddressingModes.Immediate:
            case cpu_interface_1.AddressingModes.DirectPage:
            case cpu_interface_1.AddressingModes.DirectPageIndexedIndirectX:
            case cpu_interface_1.AddressingModes.DirectPageIndexedX:
            case cpu_interface_1.AddressingModes.DirectPageIndexedY:
            case cpu_interface_1.AddressingModes.DirectPageIndirectIndexedY:
            case cpu_interface_1.AddressingModes.Relative:
                var byte = "";
                var val = this._memRead(this._regPC.get() + 1);
                if (val < 0x10) {
                    byte = "0" + val.toString(16).toUpperCase();
                }
                else {
                    byte = "" + val.toString(16).toUpperCase();
                }
                return "" + byte;
            case cpu_interface_1.AddressingModes.Implicit:
                return "";
            case cpu_interface_1.AddressingModes.Absolute:
            case cpu_interface_1.AddressingModes.AbsoluteIndexedX:
            case cpu_interface_1.AddressingModes.AbsoluteIndexedY:
            case cpu_interface_1.AddressingModes.AbsoluteIndirect:
                var highByte = "";
                var lowByte = "";
                var highVal = this._memRead(this._regPC.get() + 2);
                var lowVal = this._memRead(this._regPC.get() + 1);
                if (highVal < 0x10) {
                    highByte = "0" + highVal.toString(16).toUpperCase();
                }
                else {
                    highByte = "" + highVal.toString(16).toUpperCase();
                }
                if (lowVal < 0x10) {
                    lowByte = "0" + lowVal.toString(16).toUpperCase();
                }
                else {
                    lowByte = "" + lowVal.toString(16).toUpperCase();
                }
                return lowByte + " " + highByte;
            default:
                return "";
        }
    };
    Cpu.prototype.getCpuCycleLog = function () {
        return "CYC:" + this._currentCycles;
    };
    Cpu.prototype.getRegisterLog = function () {
        var xformedA = this._regA
            .get()
            .toString(16)
            .toUpperCase();
        if (xformedA.length < 2) {
            var paddingA = "0";
            xformedA = paddingA + xformedA;
        }
        var xformedX = this._regX
            .get()
            .toString(16)
            .toUpperCase();
        if (xformedX.length < 2) {
            var paddingX = "0";
            xformedX = paddingX + xformedX;
        }
        var xformedY = this._regY
            .get()
            .toString(16)
            .toUpperCase();
        if (xformedY.length < 2) {
            var paddingY = "0";
            xformedY = paddingY + xformedY;
        }
        var xformedP = this._regP
            .get()
            .toString(16)
            .toUpperCase();
        if (xformedP.length < 2) {
            var paddingP = "0";
            xformedP = paddingP + xformedP;
        }
        var xformedSP = this._regSP
            .get()
            .toString(16)
            .toUpperCase();
        if (xformedSP.length < 2) {
            var paddingSP = "0";
            xformedSP = paddingSP + xformedSP;
        }
        var regString = "A:" + xformedA + " X:" + xformedX + " Y:" + xformedY + " P:" + xformedP + " SP:" + xformedSP;
        return regString;
    };
    Cpu.prototype.powerUp = function () {
        this._regP.set(0x34);
        this._regA.set(0);
        this._regX.set(0);
        this._regY.set(0);
        this._regSP.set(0x01fd);
        // Frame IRQ Enabled
        this._memWrite(0x4015, 0);
        // All channels disabled
        this._memWrite(0x4017, 0);
        for (var i = 0x4000; i <= 0x400f; i++) {
            this._memWrite(i, 0x0);
        }
        for (var i = 0x0000; i <= 0x07ff; i++) {
            this._memWrite(i, 0xff);
        }
        // Perform the RESET Interrupt
        this.interruptReset();
    };
    Cpu.prototype.interruptReset = function () {
        var currPcLow = this._regPC.get() & 0xFF;
        var currPcHigh = (this._regPC.get() >> 8) & 0xFF;
        this.stackPush(currPcHigh);
        this.stackPush(currPcLow);
        this.stackPush(this._regP.get());
        this.setStatusBit(cpu_interface_1.StatusBitPositions.InterruptDisable);
        this._regPC.set((this._memRead(cpu_interface_1.ResetVectorLocation.High) << 8) |
            this._memRead(cpu_interface_1.ResetVectorLocation.Low));
        this.setStatusBit(cpu_interface_1.StatusBitPositions.InterruptDisable);
        this._currentCycles += 7;
    };
    Cpu.prototype.stackPush = function (data) {
        var address = 0x100 | this._regSP.get();
        this._memWrite(address, data);
        this._regSP.set(address - 1);
    };
    Cpu.prototype.stackPull = function () {
        var address = 0x100 | (this._regSP.get() + 1);
        this._regSP.set(address);
        return this._memRead(address);
    };
    Cpu.prototype.setPC = function (address) {
        this._regPC.set(address);
    };
    Cpu.prototype.getA = function () {
        return this._regA.get();
    };
    Cpu.prototype.getX = function () {
        return this._regX.get();
    };
    Cpu.prototype.getY = function () {
        return this._regY.get();
    };
    Cpu.prototype.getPC = function () {
        return this._regPC.get();
    };
    Cpu.prototype.getSP = function () {
        return this._regSP.get();
    };
    Cpu.prototype.getP = function () {
        return this._regP.get();
    };
    Cpu.prototype.getCurrentCycles = function () {
        return this._currentCycles;
    };
    Cpu.prototype.setStatusBit = function (bit) {
        this._regP.set(this._regP.get() | (0x01 << bit));
    };
    Cpu.prototype.clearStatusBit = function (bit) {
        this._regP.set(this._regP.get() & ~(0x01 << bit));
    };
    Cpu.prototype.getStatusBitFlag = function (bit) {
        return (this._regP.get() & (0x01 << bit)) > 0;
    };
    Cpu.prototype.isOverflow = function (first, second, final, adc) {
        if (adc) {
            if ((first & 0x80) == 0x0 && (second & 0x80) == 0x0) {
                // pos + pos = neg
                if ((final & 0x80) > 0x0) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else if ((first & 0x80) > 0x0 && (second & 0x80) > 0x0) {
                // neg + neg = pos
                if ((final & 0x80) == 0x0) {
                    return true;
                }
                else {
                    return false;
                }
            }
        }
        else {
            if ((first ^ second) & (first ^ final) & 0x80) {
                return true;
            }
            else {
                return false;
            }
        }
        return false;
    };
    Cpu.prototype.isNegative = function (value) {
        return (value & 0x80) > 0;
    };
    Cpu.prototype.isZero = function (value) {
        return value === 0;
    };
    Cpu.prototype.isCarry = function (first, second, carry, adc) {
        if (adc) {
            return first + second + carry > 0xff;
        }
        else {
            // return (first + second + carry) >= 0x0 && (first + second) <= 0xFF;
            return !(first < second);
        }
    };
    Cpu.prototype.setupNmi = function () {
        var currPcLow = this._regPC.get() & 0xFF;
        var currPcHigh = (this._regPC.get() >> 8) & 0xFF;
        this.stackPush(currPcHigh);
        this.stackPush(currPcLow);
        this.stackPush(this._regP.get());
        this.setStatusBit(cpu_interface_1.StatusBitPositions.InterruptDisable);
        this._regPC.set((this._memRead(cpu_interface_1.NmiVectorLocation.High) << 8) |
            this._memRead(cpu_interface_1.NmiVectorLocation.Low));
        this._currentCycles += 7;
        this._interrupt = cpu_interface_1.InterruptRequestType.NMI;
    };
    Cpu.prototype.adc = function (opCode) {
        var oldA = this._regA.get();
        var carry = this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Carry) ? 1 : 0;
        var operand = 0;
        var address = 0;
        var pageBoundaryCycle = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0x69:// Immediate
                address = this._addressingHelper.atImmediate(this._regPC);
                operand = this._memRead(address);
                this._regA.set(oldA + operand + carry);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0x6d:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 4;
                this._regPC.add(2);
                break;
            case 0x65:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 3;
                this._regPC.add(1);
                break;
            case 0x7d:// Absolute Indexed, X
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 4 + pageBoundaryCycle;
                this._regPC.add(2);
                break;
            case 0x79:// Absolute Indexed, Y
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 4 + pageBoundaryCycle;
                this._regPC.add(2);
                break;
            case 0x75:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 4;
                this._regPC.add(1);
                break;
            case 0x61:// Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 6;
                this._regPC.add(1);
                break;
            case 0x71:// Direct Page Indirect Indexed, Y
                if (this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 5 + pageBoundaryCycle;
                this._regPC.add(1);
                break;
        }
        if (this.isNegative(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isOverflow(oldA, operand, this._regA.get(), true)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
        }
        if (this._regA.get() === 0) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        if (this.isCarry(oldA, operand, carry, true)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
    };
    Cpu.prototype.and = function (opCode) {
        var address = 0;
        var operand = 0;
        var pageBoundaryCycle = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0x29:
                operand = this._memRead(this._regPC.get());
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 2;
                this._regPC.add(1);
                break;
            case 0x2d:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 4;
                this._regPC.add(2);
                break;
            case 0x25:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 3;
                this._regPC.add(1);
                break;
            case 0x3d:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 4 + pageBoundaryCycle;
                this._regPC.add(2);
                break;
            case 0x39:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 4 + pageBoundaryCycle;
                this._regPC.add(2);
                break;
            case 0x35:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 4;
                this._regPC.add(1);
                break;
            case 0x21:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 6;
                this._regPC.add(1);
                break;
            case 0x31:
                pageBoundaryCycle = this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)
                    ? 1
                    : 0;
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 5 + pageBoundaryCycle;
                this._regPC.add(1);
                break;
        }
        if (this.isNegative(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.asl = function (opCode) {
        var oldVal = 0;
        var result = 0;
        var address = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0x0a:
                oldVal = this._regA.get();
                result = oldVal << 1;
                this._regA.set(result);
                this._currentCycles += 2;
                break;
            case 0x0e:
                address = this._addressingHelper.atAbsolute(this._regPC);
                oldVal = this._memRead(address);
                result = oldVal << 1;
                this._memWrite(address, result);
                this._currentCycles += 6;
                this._regPC.add(2);
                break;
            case 0x06:
                address = this._addressingHelper.atDirectPage(this._regPC);
                oldVal = this._memRead(address);
                result = oldVal << 1;
                this._memWrite(address, result);
                this._currentCycles += 5;
                this._regPC.add(1);
                break;
            case 0x1e:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                oldVal = this._memRead(address);
                result = oldVal << 1;
                this._memWrite(address, result);
                this._currentCycles += 7;
                this._regPC.add(2);
                break;
            case 0x16:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                oldVal = this._memRead(address);
                result = oldVal << 1;
                this._memWrite(address, result);
                this._currentCycles += 6;
                this._regPC.add(1);
                break;
        }
        if ((oldVal & 0x80) === 0x80) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        if (this.isNegative(result & 0xff)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(result & 0xff)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.bcc = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0x90:
                var displacement = this._memRead(this._regPC.get()) & 0xff;
                if (displacement >= 0x80) {
                    displacement = -(0xff - displacement + 0x1);
                }
                if (!this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Carry)) {
                    var pcPageBoundaryByte = (this._regPC.get() + 1) & 0xff00;
                    this._regPC.add(displacement + 1);
                    // Page boundary crossed?
                    if (pcPageBoundaryByte !== (this._regPC.get() & 0xff00)) {
                        this._currentCycles += 1;
                    }
                    this._currentCycles += 1;
                }
                else {
                    // Move onto the next.
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.bcs = function (opCode) {
        if (this._regPC.get() === 0xF211) {
        }
        this._regPC.add(1);
        switch (opCode) {
            case 0xb0:
                var displacement = this._memRead(this._regPC.get()) & 0xff;
                if (displacement >= 0x80) {
                    displacement = -(0xff - displacement + 0x1);
                }
                if (this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Carry)) {
                    var pcPageBoundaryByte = (this._regPC.get() + 1) & 0xff00;
                    this._regPC.add(displacement + 1);
                    // Page boundary crossed?
                    if (pcPageBoundaryByte !== (this._regPC.get() & 0xff00)) {
                        this._currentCycles += 1;
                    }
                    this._currentCycles += 1;
                }
                else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.beq = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0xf0:
                var displacement = this._memRead(this._regPC.get()) & 0xff;
                if (displacement >= 0x80) {
                    displacement = -(0xff - displacement + 0x1);
                }
                if (this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Zero)) {
                    var pcPageBoundaryByte = (this._regPC.get() + 1) & 0xff00;
                    this._regPC.add(displacement + 1);
                    // Page boundary crossed?
                    if (pcPageBoundaryByte !== (this._regPC.get() & 0xff00)) {
                        this._currentCycles += 1;
                    }
                    this._currentCycles += 1;
                }
                else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.bit = function (opCode) {
        var address = 0;
        var operand = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0x2c:// Absolute Addressing
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                if ((operand & 0x80) > 0) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
                }
                if ((operand & 0x40) > 0) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
                }
                if ((operand & this._regA.get()) === 0) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
                }
                this._currentCycles += 4;
                this._regPC.add(2);
                break;
            case 0x24:// Direct Page Addressing
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                if (this.isNegative(operand)) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
                }
                if ((operand & 0x40) > 0) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
                }
                if ((operand & this._regA.get()) === 0) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
                }
                this._currentCycles += 3;
                this._regPC.add(1);
                break;
        }
    };
    Cpu.prototype.bmi = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0x30:
                var displacement = this._memRead(this._regPC.get()) & 0xff;
                if (displacement >= 0x80) {
                    displacement = -(0xff - displacement + 0x1);
                }
                if (this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Negative)) {
                    var pcPageBoundaryByte = (this._regPC.get() + 1) & 0xff00;
                    this._regPC.add(displacement + 1);
                    // Page boundary crossed?
                    if (pcPageBoundaryByte !== (this._regPC.get() & 0xff00)) {
                        this._currentCycles += 1;
                    }
                    this._currentCycles += 1;
                }
                else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.bne = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0xd0:
                var displacement = this._memRead(this._regPC.get()) & 0xff;
                if (displacement >= 0x80) {
                    displacement = -(0xff - displacement + 0x1);
                }
                if (!this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Zero)) {
                    var pcPageBoundaryByte = (this._regPC.get() + 1) & 0xff00;
                    this._regPC.add(displacement + 1);
                    // Page boundary crossed?
                    if (pcPageBoundaryByte !== (this._regPC.get() & 0xff00)) {
                        this._currentCycles += 1;
                    }
                    this._currentCycles += 1;
                }
                else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.bpl = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0x10:
                var displacement = this._memRead(this._regPC.get()) & 0xff;
                if (displacement >= 0x80) {
                    displacement = -(0xff - displacement + 0x1);
                }
                if (!this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Negative)) {
                    var pcPageBoundaryByte = (this._regPC.get() + 1) & 0xff00;
                    this._regPC.add(displacement + 1);
                    // Page boundary crossed?
                    if (pcPageBoundaryByte !== (this._regPC.get() & 0xff00)) {
                        this._currentCycles += 1;
                    }
                    this._currentCycles += 1;
                }
                else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.brk = function (opCode) {
        this._regPC.add(2);
        switch (opCode) {
            case 0x00:
                this.stackPush((this._regPC.get() & 0xff00) >> 8);
                this.stackPush(this._regPC.get() & 0x00ff);
                this.setStatusBit(cpu_interface_1.StatusBitPositions.BrkCausedInterrupt);
                this.stackPush(this._regP.get() | 0x10);
                this.setStatusBit(cpu_interface_1.StatusBitPositions.InterruptDisable);
                var interruptVectorLow = this._memRead(cpu_interface_1.IrqVectorLocation.Low);
                var interruptVectorHigh = this._memRead(cpu_interface_1.IrqVectorLocation.High);
                this._regPC.set((interruptVectorHigh << 8) | interruptVectorLow);
                this._currentCycles += 7;
                this._interrupt = cpu_interface_1.InterruptRequestType.IRQ;
                break;
            default:
                console.error("ERROR: Unhandled BRK opcode! " + opCode);
                break;
        }
    };
    Cpu.prototype.bvc = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0x50:
                var displacement = this._memRead(this._regPC.get()) & 0xff;
                if (displacement >= 0x80) {
                    displacement = -(0xff - displacement + 0x1);
                }
                if (!this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Overflow)) {
                    var pcPageBoundaryByte = (this._regPC.get() + 1) & 0xff00;
                    this._regPC.add(displacement + 1);
                    // Page boundary crossed?
                    if (pcPageBoundaryByte !== (this._regPC.get() & 0xff00)) {
                        this._currentCycles += 1;
                    }
                    this._currentCycles += 1;
                }
                else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.bvs = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0x70:
                var displacement = this._memRead(this._regPC.get()) & 0xff;
                if (displacement >= 0x80) {
                    displacement = -(0xff - displacement + 0x1);
                }
                if (this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Overflow)) {
                    var pcPageBoundaryByte = (this._regPC.get() + 1) & 0xff00;
                    this._regPC.add(displacement + 1);
                    // Page boundary crossed?
                    if (pcPageBoundaryByte !== (this._regPC.get() & 0xff00)) {
                        this._currentCycles += 1;
                    }
                    this._currentCycles += 1;
                }
                else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.clc = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0x18:
                this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.cld = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0xd8:
                this.clearStatusBit(cpu_interface_1.StatusBitPositions.DecimalMode);
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.cli = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0x58:
                this.clearStatusBit(cpu_interface_1.StatusBitPositions.InterruptDisable);
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.clv = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0xb8:
                this.clearStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.cmp = function (opCode) {
        var operand = 0;
        var address = 0;
        var carry = 0;
        var pageBoundaryCycle = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0xc9:// Immediate
                operand = this._memRead(this._regPC.get());
                if (this._regA.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._currentCycles += 2;
                this._regPC.add(1);
                break;
            case 0xcd:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                if (this._regA.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._currentCycles += 4;
                this._regPC.add(2);
                break;
            case 0xc5:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                if (this._regA.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._currentCycles += 3;
                this._regPC.add(1);
                break;
            case 0xdd:// Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                if (this._regA.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._currentCycles += 4 + pageBoundaryCycle;
                this._regPC.add(2);
                break;
            case 0xd9:// Absolute Indexed Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                if (this._regA.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._currentCycles += 4 + pageBoundaryCycle;
                this._regPC.add(2);
                break;
            case 0xd5:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                if (this._regA.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._currentCycles += 4;
                this._regPC.add(1);
                break;
            case 0xc1:// Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                if (this._regA.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._currentCycles += 6;
                this._regPC.add(1);
                break;
            case 0xd1:// Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                if (this._regA.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._currentCycles += 5 + pageBoundaryCycle;
                this._regPC.add(1);
                break;
        }
        if (this.isNegative(this._regA.get() - operand)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regA.get() - operand)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        if (carry === 1) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
    };
    Cpu.prototype.cpx = function (opCode) {
        var address = 0;
        var operand = 0;
        var carry = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0xe0:// Immediate
                operand = this._memRead(this._regPC.get());
                if (this._regX.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xec:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                if (this._regX.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xe4:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                if (this._regX.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
        }
        if (this.isNegative(this._regX.get() - operand)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regX.get() - operand)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        if (carry === 1) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
    };
    Cpu.prototype.cpy = function (opCode) {
        var address = 0;
        var operand = 0;
        var carry = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0xc0:// Immediate
                operand = this._memRead(this._regPC.get());
                if (this._regY.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xcc:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                if (this._regY.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xc4:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                if (this._regY.get() >= operand) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
        }
        if (this.isNegative(this._regY.get() - operand)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regY.get() - operand)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        if (carry === 1) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
    };
    Cpu.prototype.dcp = function (opcode) {
        var address = 0;
        var operand = 0;
        var carry = 0;
        // DEC then CMP
        this._regPC.add(1);
        switch (opcode) {
            case 0xc3:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                operand--;
                this._memWrite(address, operand);
                if (this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0xc7:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                operand--;
                this._memWrite(address, operand);
                if (this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0xcf:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                operand--;
                this._memWrite(address, operand);
                if (this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0xd3:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                operand--;
                this._memWrite(address, operand);
                if (this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0xd7:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                operand--;
                this._memWrite(address, operand);
                if (this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0xdb:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                operand--;
                this._memWrite(address, operand);
                if (this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0xdf:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                operand--;
                this._memWrite(address, operand);
                if (this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                }
                else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
        }
        if (this.isNegative(this._regA.get() - this._memRead(address))) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regA.get() - this._memRead(address))) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        if (carry === 1) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
    };
    Cpu.prototype.dec = function (opCode) {
        var address = 0;
        var operand = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0xce:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                this._memWrite(address, operand - 1);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0xc6:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                this._memWrite(address, operand - 1);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0xde:// Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._memWrite(address, operand - 1);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0xd6:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._memWrite(address, operand - 1);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }
        if (this.isNegative(this._memRead(address))) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._memRead(address))) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.dex = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0xca:
                this._regX.set(this._regX.get() - 1);
                this._currentCycles += 2;
                break;
        }
        if (this.isNegative(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.dey = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0x88:
                this._regY.set(this._regY.get() - 1);
                this._currentCycles += 2;
                break;
        }
        if (this.isNegative(this._regY.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regY.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.eor = function (opCode) {
        var address = 0;
        var operand = 0;
        var result = 0;
        var pageBoundaryCycle = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0x49:// Immediate
                operand = this._memRead(this._regPC.get());
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0x4d:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x45:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x5d:// Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4 + pageBoundaryCycle;
                break;
            case 0x59:// Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4 + pageBoundaryCycle;
                break;
            case 0x55:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0x41:// Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x51:// Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 5 + pageBoundaryCycle;
                break;
        }
        if (this.isNegative(result)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(result)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.inc = function (opCode) {
        var address = 0;
        var operand = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0xee:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                this._memWrite(address, operand + 1);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0xe6:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                this._memWrite(address, operand + 1);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0xfe:// Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._memWrite(address, operand + 1);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0xf6:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._memWrite(address, operand + 1);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }
        if (this.isNegative(this._memRead(address))) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._memRead(address))) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.inx = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0xe8:
                this._regX.set(this._regX.get() + 1);
                this._currentCycles += 2;
                break;
        }
        if (this.isNegative(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.iny = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0xc8:
                this._regY.set(this._regY.get() + 1);
                this._currentCycles += 2;
                break;
        }
        if (this.isNegative(this._regY.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regY.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.isb = function (opcode) {
        var address = 0;
        var operand = 0;
        var result = 0;
        var oldA = this._regA.get();
        // Subtract 1 more if carry is clear!
        var currentCarry = !this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Carry) ? 1 : 0;
        this._regPC.add(1);
        // INC then SBC
        switch (opcode) {
            case 0xe3:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);
                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0xe7:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);
                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0xef:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);
                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0xf3:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);
                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0xf7:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);
                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0xfb:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);
                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0xff:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);
                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
        }
        if (this.isNegative(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isOverflow(oldA, this._memRead(address), this._regA.get(), false)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
        }
        if (this.isZero(result)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        if (this.isCarry(oldA, this._memRead(address), currentCarry, false)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
    };
    Cpu.prototype.jmp = function (opCode) {
        var address = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0x4c:
                address = this._addressingHelper.atAbsolute(this._regPC);
                this._regPC.set(address);
                this._currentCycles += 3;
                break;
            case 0x6c:
                address = this._addressingHelper.atAbsoluteIndirect(this._regPC);
                if ((this._regPC.get() & 0x00ff) === 0x00ff) {
                    this._currentCycles += 1;
                }
                this._regPC.set(address);
                this._currentCycles += 5;
                break;
        }
    };
    Cpu.prototype.jsr = function (opCode) {
        this._regPC.add(1);
        switch (opCode) {
            case 0x20:// Absolute
                var address = this._addressingHelper.atAbsolute(this._regPC);
                this._regPC.add(1);
                this.stackPush((this._regPC.get() & 0xff00) >> 8);
                this.stackPush(this._regPC.get() & 0x00ff);
                this._regPC.set(address);
                this._currentCycles += 6;
                break;
        }
    };
    Cpu.prototype.lax = function (opcode) {
        var address = 0;
        var operand = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0xa3:// Direct Indirect X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0xa7:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xaf:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xb3:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    this._currentCycles++;
                }
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0xb7:
                address = this._addressingHelper.atDirectPageIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0xbf:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    this._currentCycles++;
                }
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
        }
        if (this.isNegative(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.lda = function (opCode) {
        var address = 0;
        var operand = 0;
        var pageBoundaryCycle = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0xa9:// Immediate
                operand = this._memRead(this._regPC.get());
                this._currentCycles += 2;
                this._regA.set(operand);
                this._regPC.add(1);
                break;
            case 0xad:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xa5:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xbd:// Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4 + pageBoundaryCycle;
                break;
            case 0xb9:// Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4 + pageBoundaryCycle;
                break;
            case 0xb5:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0xa1:// Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0xb1:// Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += 5 + pageBoundaryCycle;
                break;
        }
        if (this.isNegative(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.ldx = function (opCode) {
        var operand = 0;
        var address = 0;
        var pageBoundaryCycle = 0;
        this._regPC.add(1);
        switch (opCode) {
            case 0xa2:// Immediate
                operand = this._memRead(this._regPC.get());
                this._regX.set(operand);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xae:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                this._regX.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xa6:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                this._regX.set(operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xbe:// Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                this._regX.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4 + pageBoundaryCycle;
                break;
            case 0xb6:// Direct Page Indexed, Y
                address = this._addressingHelper.atDirectPageIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                this._regX.set(operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
        }
        if (this.isNegative(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.ldy = function (opcode) {
        var operand = 0;
        var address = 0;
        var pageBoundaryCycle = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0xa0:// Immediate
                operand = this._memRead(this._regPC.get());
                this._regY.set(operand);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xac:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                this._regY.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xa4:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                this._regY.set(operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xbc:// Absolute Indexed X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                this._regY.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4 + pageBoundaryCycle;
                break;
            case 0xb4:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._regY.set(operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
        }
        if (this.isNegative(this._regY.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regY.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.lsr = function (opcode) {
        var address = 0;
        var operand = 0;
        var carry = 0;
        var result = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0x4a:// Accumulator
                operand = this._regA.get();
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._regA.set(result);
                this._currentCycles += 2;
                break;
            case 0x4e:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x46:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x5e:// Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x56:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }
        if (this.isNegative(result & 0xff)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(result & 0xff)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        if (carry === 1) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
    };
    Cpu.prototype.nop = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x1a:
            case 0x3a:
            case 0x5a:
            case 0x7a:
            case 0xda:
            case 0xfa:
            case 0xea:
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.skb = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x80:
            case 0x82:
            case 0x89:
            case 0xc2:
            case 0xe2:
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.ign = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x0c:
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x1c:
            case 0x3c:
            case 0x5c:
            case 0x7c:
            case 0xdc:
            case 0xfc:
                var pageBoundaryCycle = 0;
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                this._regPC.add(2);
                this._currentCycles += 4 + pageBoundaryCycle;
                break;
            case 0x04:
            case 0x44:
            case 0x64:
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x14:
            case 0x34:
            case 0x54:
            case 0x74:
            case 0xd4:
            case 0xf4:
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
        }
    };
    Cpu.prototype.ora = function (opcode) {
        var address = 0;
        var operand = 0;
        var result = 0;
        var pageBoundaryCycle = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0x09:// Immediate
                operand = this._memRead(this._regPC.get());
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0x0d:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x05:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x1d:// Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4 + pageBoundaryCycle;
                break;
            case 0x19:// Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4 + pageBoundaryCycle;
                break;
            case 0x15:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0x01:// Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x11:// Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 5 + pageBoundaryCycle;
                break;
        }
        if (this.isNegative(result)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(result)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.pha = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x48:
                this.stackPush(this._regA.get());
                this._currentCycles += 3;
                break;
        }
    };
    Cpu.prototype.php = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x08:
                var pStatus = this._regP.get() | 0x10;
                this.stackPush(pStatus);
                this._currentCycles += 3;
                break;
        }
    };
    Cpu.prototype.pla = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x68:
                this._regA.set(this.stackPull());
                this._currentCycles += 4;
                break;
        }
        if (this.isNegative(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.plp = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x28:
                var pStatus = this.stackPull();
                pStatus = pStatus | 0x20;
                this._regP.set(pStatus);
                this.clearStatusBit(cpu_interface_1.StatusBitPositions.BrkCausedInterrupt);
                this._currentCycles += 4;
                break;
        }
    };
    Cpu.prototype.rla = function (opcode) {
        var address = 0;
        var operand = 0;
        var newCarry = 0;
        var oldCarry = this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Carry) ? 1 : 0;
        this._regPC.add(1);
        // ROL and AND
        switch (opcode) {
            case 0x23:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                this._memWrite(address, (operand << 1) | oldCarry);
                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x27:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                this._memWrite(address, (operand << 1) | oldCarry);
                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x2f:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                this._memWrite(address, (operand << 1) | oldCarry);
                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x33:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                this._memWrite(address, (operand << 1) | oldCarry);
                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x37:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                this._memWrite(address, (operand << 1) | oldCarry);
                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x3b:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                this._memWrite(address, (operand << 1) | oldCarry);
                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x3f:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                this._memWrite(address, (operand << 1) | oldCarry);
                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
        }
        if (newCarry === 1) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        if (this.isNegative(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.rol = function (opcode) {
        var operand = 0;
        var address = 0;
        var result = 0;
        var oldCarry = this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Carry) ? 1 : 0;
        var newCarry = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0x2a:// Accumulator
                operand = this._regA.get();
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                result = (operand << 1) | oldCarry;
                this._regA.set(result);
                this._currentCycles += 2;
                break;
            case 0x2e:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                result = (operand << 1) | oldCarry;
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x26:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                result = (operand << 1) | oldCarry;
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x3e:// Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                result = (operand << 1) | oldCarry;
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x36:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = (operand & 0x80) > 0 ? 1 : 0;
                result = (operand << 1) | oldCarry;
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }
        if (this.isNegative(result & 0xff)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(result & 0xff)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        if (newCarry === 1) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
    };
    Cpu.prototype.ror = function (opcode) {
        var operand = 0;
        var address = 0;
        var result = 0;
        var oldCarry = this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Carry) ? 1 : 0;
        var newCarry = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0x6a:// Accumulator
                operand = this._regA.get();
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                result = (operand >> 1) | (oldCarry << 7);
                this._regA.set(result);
                this._currentCycles += 2;
                break;
            case 0x6e:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                result = (operand >> 1) | (oldCarry << 7);
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x66:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                result = (operand >> 1) | (oldCarry << 7);
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x7e:// Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                result = (operand >> 1) | (oldCarry << 7);
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x76:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                result = (operand >> 1) | (oldCarry << 7);
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }
        if (this.isNegative(result & 0xff)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(result & 0xff)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        if (newCarry === 1) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
    };
    Cpu.prototype.rra = function (opcode) {
        var address = 0;
        var operand = 0;
        var oldCarry = this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Carry) ? 1 : 0;
        var newCarry = 0;
        var oldA = 0;
        // ROR and then ADC
        this._regPC.add(1);
        switch (opcode) {
            case 0x63:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                operand = (operand >> 1) | (oldCarry << 7);
                this._memWrite(address, operand);
                if (newCarry === 1) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                // adc time
                oldA = this._regA.get();
                this._regA.set(this._regA.get() + this._memRead(address) + newCarry);
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x67:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                operand = (operand >> 1) | (oldCarry << 7);
                this._memWrite(address, operand);
                if (newCarry === 1) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                // adc time
                oldA = this._regA.get();
                this._regA.set(this._regA.get() + this._memRead(address) + newCarry);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x6f:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                operand = (operand >> 1) | (oldCarry << 7);
                this._memWrite(address, operand);
                if (newCarry === 1) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                // adc time
                oldA = this._regA.get();
                this._regA.set(this._regA.get() + this._memRead(address) + newCarry);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x73:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                operand = (operand >> 1) | (oldCarry << 7);
                this._memWrite(address, operand);
                if (newCarry === 1) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                // adc time
                oldA = this._regA.get();
                this._regA.set(this._regA.get() + this._memRead(address) + newCarry);
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x77:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                operand = (operand >> 1) | (oldCarry << 7);
                this._memWrite(address, operand);
                if (newCarry === 1) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                // adc time
                oldA = this._regA.get();
                this._regA.set(this._regA.get() + this._memRead(address) + newCarry);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x7b:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                operand = (operand >> 1) | (oldCarry << 7);
                this._memWrite(address, operand);
                if (newCarry === 1) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                // adc time
                oldA = this._regA.get();
                this._regA.set(this._regA.get() + this._memRead(address) + newCarry);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x7f:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = (operand & 0x0001) > 0 ? 1 : 0;
                operand = (operand >> 1) | (oldCarry << 7);
                this._memWrite(address, operand);
                if (newCarry === 1) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                // adc time
                oldA = this._regA.get();
                this._regA.set(this._regA.get() + this._memRead(address) + newCarry);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
        }
        if (this.isNegative(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isOverflow(oldA, this._memRead(address), this._regA.get(), true)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
        }
        if (this._regA.get() === 0) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        if (this.isCarry(oldA, this._memRead(address), newCarry, true)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
    };
    Cpu.prototype.rti = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x40:
                var newP = this.stackPull();
                var pcLow = this.stackPull();
                var pcHigh = this.stackPull();
                this._regPC.set((pcHigh << 8) | pcLow);
                this._regP.set(newP);
                this.clearStatusBit(cpu_interface_1.StatusBitPositions.BrkCausedInterrupt);
                this.setStatusBit(cpu_interface_1.StatusBitPositions.Bit5);
                this._currentCycles += 6;
                break;
        }
    };
    Cpu.prototype.rts = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x60:
                var newLowPC = this.stackPull();
                var newHighPC = this.stackPull();
                this._regPC.set((newHighPC << 8) | newLowPC);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }
    };
    Cpu.prototype.sax = function (opcode) {
        var address = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0x83:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                this._memWrite(address, this._regA.get() & this._regX.get());
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x87:
                address = this._addressingHelper.atDirectPage(this._regPC);
                this._memWrite(address, this._regA.get() & this._regX.get());
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x8f:
                address = this._addressingHelper.atAbsolute(this._regPC);
                this._memWrite(address, this._regA.get() & this._regX.get());
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x97:
                address = this._addressingHelper.atDirectPageIndexedY(this._regPC, this._regY);
                this._memWrite(address, this._regA.get() & this._regX.get());
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
        }
    };
    Cpu.prototype.sbc = function (opcode) {
        var address = 0;
        var operand = 0;
        var result = 0;
        var pageBoundaryCycle = 0;
        var oldA = this._regA.get();
        // Subtract 1 more if carry is clear!
        var currentCarry = !this.getStatusBitFlag(cpu_interface_1.StatusBitPositions.Carry) ? 1 : 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0xeb:
            case 0xe9:// Immediate
                operand = this._memRead(this._regPC.get());
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xed:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xe5:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xfd:// Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4 + pageBoundaryCycle;
                break;
            case 0xf9:// Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4 + pageBoundaryCycle;
                break;
            case 0xf5:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0xe1:// Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                //
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0xf1:// Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if (this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 5 + pageBoundaryCycle;
                break;
        }
        if (this.isNegative(result)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isOverflow(oldA, operand, result, false)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Overflow);
        }
        if (this.isZero(result)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        if (this.isCarry(oldA, operand, currentCarry, false)) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
    };
    Cpu.prototype.sec = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x38:
                this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.sed = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0xf8:
                this.setStatusBit(cpu_interface_1.StatusBitPositions.DecimalMode);
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.sei = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x78:
                this.setStatusBit(cpu_interface_1.StatusBitPositions.InterruptDisable);
                this._currentCycles += 2;
                break;
        }
    };
    Cpu.prototype.slo = function (opcode) {
        var address = 0;
        var operand = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0x03:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                if ((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                operand <<= 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() | this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x07:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                if ((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                operand <<= 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() | this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x0f:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                if ((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                operand <<= 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() | this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x13:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                if ((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                operand <<= 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() | this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x17:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                if ((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                operand <<= 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() | this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x1b:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                if ((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                operand <<= 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() | this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x1f:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                if ((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                else {
                    this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
                }
                operand <<= 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() | this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
        }
        if (this.isNegative(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.sre = function (opcode) {
        var address = 0;
        var operand = 0;
        var carry = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0x43:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                operand = operand >> 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() ^ this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x47:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                operand = operand >> 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() ^ this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x4f:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                operand = operand >> 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() ^ this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x53:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                operand = operand >> 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() ^ this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x57:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                operand = operand >> 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() ^ this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x5b:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                operand = operand >> 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() ^ this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x5f:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                operand = operand >> 1;
                this._memWrite(address, operand);
                this._regA.set(this._regA.get() ^ this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
        }
        if (carry === 1) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Carry);
        }
        if (this.isNegative(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.sta = function (opcode) {
        var operand = 0;
        var address = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0x8d:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x85:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x9d:// Absolute Indexed X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(2);
                this._currentCycles += 5;
                break;
            case 0x99:// Absolute Indexed Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(2);
                this._currentCycles += 5;
                break;
            case 0x95:// Direct Page Indexed X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0x81:// Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x91:// Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }
    };
    Cpu.prototype.stx = function (opcode) {
        var address = 0;
        var operand = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0x8e:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._regX.get();
                this._memWrite(address, operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x86:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._regX.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x96:// Direct Page Indexed, Y
                address = this._addressingHelper.atDirectPageIndexedY(this._regPC, this._regY);
                operand = this._regX.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
        }
    };
    Cpu.prototype.sty = function (opcode) {
        var address = 0;
        var operand = 0;
        this._regPC.add(1);
        switch (opcode) {
            case 0x8c:// Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._regY.get();
                this._memWrite(address, operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x84:// Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._regY.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x94:// Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._regY.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
        }
    };
    Cpu.prototype.tax = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0xaa:
                this._regX.set(this._regA.get());
                this._currentCycles += 2;
                break;
        }
        if (this.isNegative(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.tay = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0xa8:
                this._regY.set(this._regA.get());
                this._currentCycles += 2;
                break;
        }
        if (this.isNegative(this._regY.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regY.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.tsx = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0xba:
                this._regX.set(this._regSP.get());
                this._currentCycles += 2;
                break;
        }
        if (this.isNegative(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regX.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.txa = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x8a:
                this._regA.set(this._regX.get());
                this._currentCycles += 2;
                break;
        }
        if (this.isNegative(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.txs = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x9a:
                this._regSP.set(this._regX.get());
                this._currentCycles += 2;
                break;
            default:
                break;
        }
    };
    Cpu.prototype.tya = function (opcode) {
        this._regPC.add(1);
        switch (opcode) {
            case 0x98:
                this._regA.set(this._regY.get());
                this._currentCycles += 2;
                break;
            default:
                break;
        }
        if (this.isNegative(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Negative);
        }
        if (this.isZero(this._regA.get())) {
            this.setStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
        else {
            this.clearStatusBit(cpu_interface_1.StatusBitPositions.Zero);
        }
    };
    Cpu.prototype.runStallCycle = function () {
        this._stallCycles--;
        this._currentCycles++;
    };
    Cpu.prototype.handleOp = function (opCode) {
        switch (opCode) {
            case 0x00:
                this.brk(opCode);
                break;
            case 0x01:
            case 0x05:
            case 0x09:
            case 0x0d:
            case 0x11:
            case 0x15:
            case 0x19:
            case 0x1d:
                this.ora(opCode);
                break;
            case 0x06:
            case 0x0a:
            case 0x0e:
            case 0x16:
            case 0x1e:
                this.asl(opCode);
                break;
            case 0x08:
                this.php(opCode);
                break;
            case 0x0c:
            case 0x1c:
            case 0x3c:
            case 0x5c:
            case 0x7c:
            case 0xdc:
            case 0xfc:
            case 0x04:
            case 0x44:
            case 0x64:
            case 0x14:
            case 0x34:
            case 0x54:
            case 0x74:
            case 0xd4:
            case 0xf4:
                this.ign(opCode);
                break;
            case 0x10:
                this.bpl(opCode);
                break;
            case 0x18:
                this.clc(opCode);
                break;
            case 0x20:
                this.jsr(opCode);
                break;
            case 0x21:
            case 0x25:
            case 0x29:
            case 0x2d:
            case 0x31:
            case 0x35:
            case 0x39:
            case 0x3d:
                this.and(opCode);
                break;
            case 0x24:
            case 0x2c:
                this.bit(opCode);
                break;
            case 0x26:
            case 0x2a:
            case 0x2e:
            case 0x36:
            case 0x3e:
                this.rol(opCode);
                break;
            case 0x28:
                this.plp(opCode);
                break;
            case 0x30:
                this.bmi(opCode);
                break;
            case 0x38:
                this.sec(opCode);
                break;
            case 0x40:
                this.rti(opCode);
                break;
            case 0x41:
            case 0x45:
            case 0x49:
            case 0x4d:
            case 0x51:
            case 0x55:
            case 0x59:
            case 0x5d:
                this.eor(opCode);
                break;
            case 0x46:
            case 0x4a:
            case 0x4e:
            case 0x56:
            case 0x5e:
                this.lsr(opCode);
                break;
            case 0x48:
                this.pha(opCode);
                break;
            case 0x4c:
            case 0x6c:
                this.jmp(opCode);
                break;
            case 0x50:
                this.bvc(opCode);
                break;
            case 0x58:
                this.cli(opCode);
                break;
            case 0x60:
                this.rts(opCode);
                break;
            case 0x61:
            case 0x65:
            case 0x69:
            case 0x6d:
            case 0x71:
            case 0x75:
            case 0x79:
            case 0x7d:
                this.adc(opCode);
                break;
            case 0x66:
            case 0x6a:
            case 0x6e:
            case 0x76:
            case 0x7e:
                this.ror(opCode);
                break;
            case 0x68:
                this.pla(opCode);
                break;
            case 0x70:
                this.bvs(opCode);
                break;
            case 0x78:
                this.sei(opCode);
                break;
            case 0x81:
            case 0x85:
            case 0x8d:
            case 0x91:
            case 0x95:
            case 0x99:
            case 0x9d:
                this.sta(opCode);
                break;
            case 0x84:
            case 0x8c:
            case 0x94:
                this.sty(opCode);
                break;
            case 0x86:
            case 0x8e:
            case 0x96:
                this.stx(opCode);
                break;
            case 0x88:
                this.dey(opCode);
                break;
            case 0x8a:
                this.txa(opCode);
                break;
            case 0x90:
                this.bcc(opCode);
                break;
            case 0x98:
                this.tya(opCode);
                break;
            case 0x9a:
                this.txs(opCode);
                break;
            case 0xa0:
            case 0xa4:
            case 0xac:
            case 0xb4:
            case 0xbc:
                this.ldy(opCode);
                break;
            case 0xa1:
            case 0xa5:
            case 0xa9:
            case 0xad:
            case 0xb1:
            case 0xb5:
            case 0xb9:
            case 0xbd:
                this.lda(opCode);
                break;
            case 0xa2:
            case 0xa6:
            case 0xae:
            case 0xb6:
            case 0xbe:
                this.ldx(opCode);
                break;
            case 0xa8:
                this.tay(opCode);
                break;
            case 0xaa:
                this.tax(opCode);
                break;
            case 0xb0:
                this.bcs(opCode);
                break;
            case 0xb8:
                this.clv(opCode);
                break;
            case 0xba:
                this.tsx(opCode);
                break;
            case 0xc0:
            case 0xc4:
            case 0xcc:
                this.cpy(opCode);
                break;
            case 0xc1:
            case 0xc5:
            case 0xc9:
            case 0xcd:
            case 0xd1:
            case 0xd5:
            case 0xd9:
            case 0xdd:
                this.cmp(opCode);
                break;
            case 0xc6:
            case 0xce:
            case 0xd6:
            case 0xde:
                this.dec(opCode);
                break;
            case 0xc8:
                this.iny(opCode);
                break;
            case 0xca:
                this.dex(opCode);
                break;
            case 0xd0:
                this.bne(opCode);
                break;
            case 0xd8:
                this.cld(opCode);
                break;
            case 0xe0:
            case 0xe4:
            case 0xec:
                this.cpx(opCode);
                break;
            case 0xe1:
            case 0xe5:
            case 0xeb:
            case 0xe9:
            case 0xed:
            case 0xf1:
            case 0xf5:
            case 0xf9:
            case 0xfd:
                this.sbc(opCode);
                break;
            case 0xe6:
            case 0xee:
            case 0xf6:
            case 0xfe:
                this.inc(opCode);
                break;
            case 0xe8:
                this.inx(opCode);
                break;
            case 0x1a:
            case 0x3a:
            case 0x5a:
            case 0x7a:
            case 0xda:
            case 0xfa:
            case 0xea:
                this.nop(opCode);
                break;
            case 0x80:
            case 0x82:
            case 0x89:
            case 0xc2:
            case 0xe2:
                this.skb(opCode);
                break;
            case 0xf0:
                this.beq(opCode);
                break;
            case 0xf8:
                this.sed(opCode);
                break;
            case 0xa3:
            case 0xa7:
            case 0xaf:
            case 0xb3:
            case 0xb7:
            case 0xbf:
                this.lax(opCode);
                break;
            case 0x83:
            case 0x87:
            case 0x8f:
            case 0x97:
                this.sax(opCode);
                break;
            case 0xc3:
            case 0xc7:
            case 0xcf:
            case 0xd3:
            case 0xd7:
            case 0xdb:
            case 0xdf:
                this.dcp(opCode);
                break;
            case 0xe3:
            case 0xe7:
            case 0xef:
            case 0xf3:
            case 0xf7:
            case 0xfb:
            case 0xff:
                this.isb(opCode);
                break;
            case 0x03:
            case 0x07:
            case 0x0f:
            case 0x13:
            case 0x17:
            case 0x1b:
            case 0x1f:
                this.slo(opCode);
                break;
            case 0x23:
            case 0x27:
            case 0x2f:
            case 0x33:
            case 0x37:
            case 0x3b:
            case 0x3f:
                this.rla(opCode);
                break;
            case 0x43:
            case 0x47:
            case 0x4f:
            case 0x53:
            case 0x57:
            case 0x5b:
            case 0x5f:
                this.sre(opCode);
                break;
            case 0x63:
            case 0x67:
            case 0x6f:
            case 0x73:
            case 0x77:
            case 0x7b:
            case 0x7f:
                this.rra(opCode);
                break;
            default:
                break;
        }
    };
    return Cpu;
}());
exports.Cpu = Cpu;

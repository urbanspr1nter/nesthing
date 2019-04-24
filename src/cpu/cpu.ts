import { ByteRegister } from './byte-register';
import { DoubleByteRegister } from './double-byte-register';
import { Memory } from '../memory/memory';
import { 
    AddressingModes, 
    IrqVectorLocation, 
    NmiVectorLocation, 
    OpAddressingMode, 
    OpLabel, 
    ResetVectorLocation, 
    StatusBitPositions 
} from './cpu.interface';
import { CpuAddressingHelper } from './cpu-addressing-helper';

export class Cpu {
    private _dbg: boolean;
    private _memory: Memory;
    private _addressingHelper: CpuAddressingHelper;

    private _currentCycles: number;

    private _regA: ByteRegister;
    private _regX: ByteRegister;
    private _regY: ByteRegister;

    private _regPC: DoubleByteRegister;
    private _regSP: ByteRegister;
    private _regP: ByteRegister;

    private _log: string[];

    constructor(memory: Memory, log: string[]) {
        this._dbg = false;

        this._currentCycles = 0;

        this._log = log;
        this._memory = memory;
        this._addressingHelper = new CpuAddressingHelper(this._memory);

        this._regA = new ByteRegister(0x00);
        this._regX = new ByteRegister(0x00);
        this._regY = new ByteRegister(0x00);
        this._regPC = new DoubleByteRegister(0x00);
        this._regSP = new ByteRegister(0x00);
        this._regP = new ByteRegister(0x00);
    }

    public debugMode(value: boolean): void {
        this._dbg = value;
    }

    private _memWrite(address: number, data: number) {
        this._memory.set(address, data);
    }

    private _memRead(address: number): number {
        return this._memory.get(address);
    }

    public getLogEntry(
        opcode: number
    ) {        
        let formattedOpcode = `${opcode.toString(16).toUpperCase()}`;
        if(formattedOpcode.length < 2) {
            formattedOpcode = `0${formattedOpcode}`;
        }

        let output = ``;

        output = `${this.getPcLog()}  ${formattedOpcode} ${this.getByteLookAhead(OpAddressingMode[opcode])}`;
        let spaces = 16 - output.length;
        for(let i = 0; i < spaces; i++) {
            output += ` `;
        }
        output = `${output}${OpLabel[opcode]} ${this.getAddressString(OpAddressingMode[opcode])}`;
        
        spaces = 48 - output.length;
        for(let i = 0; i < spaces; i++) {
            output += ` `;
        }
        output += ` `;

        output += `${this.getRegisterLog()} ${/*this.getPpuLog()*/''} ${this.getCpuCycleLog()}`;

        return output;
    }

    public getAddressString(addressingMode: AddressingModes) {

        let byteString = ``;
        switch(addressingMode) {
            case AddressingModes.Immediate:
                let data = this._memRead(this._regPC.get() + 1).toString(16).toUpperCase();
                if(data.length < 2) {
                    data = '0' + data;
                }
                byteString = `#$${data}`;
                break;
            case AddressingModes.DirectPage:
                byteString = `${this._memRead(this._regPC.get() + 1).toString(16).toUpperCase()}`;
                if(byteString.length < 2) {
                    byteString = `0${byteString}`;
                }
                byteString = `$${byteString}`
                break;
            case AddressingModes.Accumulator:
                byteString = `A`;
                break;
            case AddressingModes.Absolute:
            case AddressingModes.AbsoluteIndirect:
                let lowByte = this._memRead(this._regPC.get() + 1).toString(16).toUpperCase();
                if(lowByte.length < 2) {
                    lowByte = `0${lowByte}`;
                }
                let highByte = this._memRead(this._regPC.get() + 2).toString(16).toUpperCase();
                if(highByte.length < 2) {
                    highByte = `0${highByte};`
                }

                byteString  = `$${highByte}${lowByte}`;
                break;
            case AddressingModes.Relative:
                let displacement = this._memRead(this._regPC.get() + 1);
                if(displacement >= 0x80) {
                    displacement = -((0xFF - displacement) + 1);
                }
                let final = (this._regPC.get() + 2) + displacement;

                byteString = `$${final.toString(16).toUpperCase()}`;
                break;
            case AddressingModes.Implicit:
                byteString  = ``;
                break;
        }

        return byteString;
    }

    public getPcLog() {
        const currentPC = this._regPC.get();

        let xformedPC = currentPC.toString(16).toUpperCase();
        if(xformedPC.length < 4) {
            let difference = 4 - xformedPC.length;
            let paddingPC = '';
            for(let i = 0; i < difference; i++) {
                paddingPC += '0';
            }
            xformedPC = paddingPC + xformedPC;
        }

        return xformedPC;
    }

    public getByteLookAhead(addressingMode: AddressingModes) {
        switch(addressingMode) {
            case AddressingModes.Immediate:
            case AddressingModes.DirectPage:
            case AddressingModes.DirectPageIndexedIndirectX:
            case AddressingModes.DirectPageIndexedX:
            case AddressingModes.DirectPageIndexedY:
            case AddressingModes.DirectPageIndirectIndexedY:
            case AddressingModes.Relative:
                let byte = '';
                let val = this._memRead(this._regPC.get() + 1);
                if(val < 0x10) {
                    byte = `0${val.toString(16).toUpperCase()}`;
                } else {
                    byte = `${val.toString(16).toUpperCase()}`;
                }
                return `${byte}`;
            case AddressingModes.Implicit:
                return ``;
            case AddressingModes.Absolute:
            case AddressingModes.AbsoluteIndexedX:
            case AddressingModes.AbsoluteIndexedY:
            case AddressingModes.AbsoluteIndirect:
                let highByte = ``;
                let lowByte = ``;
                let highVal = this._memRead(this._regPC.get() + 2);
                let lowVal = this._memRead(this._regPC.get() + 1);

                if(highVal < 0x10) {
                    highByte = `0${highVal.toString(16).toUpperCase()}`;
                } else {
                    highByte = `${highVal.toString(16).toUpperCase()}`;
                }

                if(lowVal < 0x10) {
                    lowByte = `0${lowVal.toString(16).toUpperCase()}`;
                } else {
                    lowByte = `${lowVal.toString(16).toUpperCase()}`;
                }

                return `${lowByte} ${highByte}`;

            default:
                return ``;
        }
    }

    public getCpuCycleLog() {
        return `CYC:${this._currentCycles}`;
    }

    public getRegisterLog() {
        let xformedA = this._regA.get().toString(16).toUpperCase();
        if(xformedA.length < 2) {
            let paddingA = '0';
            xformedA = paddingA + xformedA;
        }

        let xformedX = this._regX.get().toString(16).toUpperCase();
        if(xformedX.length < 2) {
            let paddingX = '0';
            xformedX = paddingX + xformedX;
        }

        let xformedY = this._regY.get().toString(16).toUpperCase();
        if(xformedY.length < 2) {
            let paddingY = '0';
            xformedY = paddingY + xformedY;
        }

        let xformedP = this._regP.get().toString(16).toUpperCase();
        if(xformedP.length < 2) {
            let paddingP = '0';
            xformedP = paddingP + xformedP;
        }

        let xformedSP = this._regSP.get().toString(16).toUpperCase();
        if(xformedSP.length < 2) {
            let paddingSP = '0';
            xformedSP = paddingSP + xformedSP;
        }

        let regString = `A:${xformedA} X:${xformedX} Y:${xformedY} P:${xformedP} SP:${xformedSP}`;

        return regString;
    }

    public powerUp(): void {
        // Need to set to 0x24 if using nestest ROM.
        this._regP.set(0x24);
        // this._regP.set(0x34);

        this._regA.set(0);
        this._regX.set(0);
        this._regY.set(0);
        this._regSP.set(0x01FD);

        // Frame IRQ Enabled
        this._memWrite(0x4015, 0);
        
        // All cannels disabled
        this._memWrite(0x4017, 0);

        for(let i = 0x4000; i <= 0x400F; i++) {
            this._memWrite(i, 0x0);
        }

        // Initialize RAM (0x0000->0x07FFF) values to 0xFF
        for(let i = 0x0000; i <= 0x07FF; i++) {
            this._memWrite(i, 0xFF);
        }

        // If using nestest ROM, actually set the PC to 0xC000.
        // this._regPC.set(0xC000);

        // The PC is set from the bytes found in 0xFFFC, 0xFFFD
        const lowByte = this._memRead(ResetVectorLocation.Low);
        const highByte = this._memRead(ResetVectorLocation.High);

        this._regPC.set((highByte << 8) | lowByte);

        // Perform an IRQ Operation
        // this._currentCycles = 7;
    }

    public stackPush(data: number): void {
        const address = 0x100 | (this._regSP.get());
        this._memWrite(address, data);
        this._regSP.set(address - 1);
    }

    public stackPull(): number {
        const address = 0x100 | (this._regSP.get() + 1);
        this._regSP.set(address);
        return this._memRead(address);
    }

    public setPC(address: number) {
        this._regPC.set(address);
    }

    public getA(): number {
        return this._regA.get();
    }
    public getX(): number {
        return this._regX.get();
    }
    public getY(): number {
        return this._regY.get();
    }
    public getPC(): number {
        return this._regPC.get();
    }
    public getSP(): number {
        return this._regSP.get();
    }
    public getP(): number {
        return this._regP.get();
    }
    public getCurrentCycles(): number {
        return this._currentCycles;
    }

    public setStatusBit(bit: StatusBitPositions): void {
        this._regP.set(this._regP.get() | (0x01 << bit));
    }

    public clearStatusBit(bit: StatusBitPositions) : void {
        this._regP.set(this._regP.get() & ~(0x01 << bit));
    }

    public getStatusBitFlag(bit: StatusBitPositions): boolean {
        return (this._regP.get() & (0x01 << bit)) > 0;
    }

    public isOverflow(first: number, second: number, final: number, adc: boolean): boolean {
        if(adc) {
            if((first & 0x80) == 0x0 && (second & 0x80) == 0x0) {
                // pos + pos = neg
                if((final & 0x80) > 0x0) {
                    return true;
                } else {
                    return false;
                }
            }
            else if((first & 0x80) > 0x0 && (second & 0x80) > 0x0) {
                // neg + neg = pos
                if((final & 0x80) == 0x0) {
                    return true;
                } else {
                    return false;
                }
            }
        } else {
            if((first ^ second) & (first ^ final) & 0x80) {
                return true;
            } else {
                return false;
            }
        }

        return false;
    }

    public isNegative(value: number): boolean {
        return (value & 0x80) > 0;
    }

    public isZero(value: number): boolean {
        return value === 0;
    }

    public isCarry(first: number, second: number, carry: number, adc: boolean) {
        if(adc) {
            return (first + second + carry) > 0xFF;
        } else {
            // return (first + second + carry) >= 0x0 && (first + second) <= 0xFF;
            return !(first < second);
        }
    }

    public handleNmiIrq() {
        const currPcLow = this._regPC.get() & 0xFF;
        const currPcHigh = (this._regPC.get() >> 8) & 0xFF;

        this.stackPush(currPcHigh);
        this.stackPush(currPcLow);

        this.stackPush(this._regP.get());

        this.setStatusBit(StatusBitPositions.InterruptDisable);

        this._regPC.set((this._memRead(NmiVectorLocation.High) << 8) | this._memRead(NmiVectorLocation.Low));
        
        this._currentCycles += 7;
    }

    public adc(opCode: number) {
        const oldA = this._regA.get();
        const carry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;

        let operand = 0;
        let address = 0;
        let pageBoundaryCycle = 0;
        
        this._regPC.add(1);
        switch(opCode) {
            case 0x69: // Immediate
                address = this._addressingHelper.atImmediate(this._regPC);
                operand = this._memRead(address);
                
                this._regA.set(oldA + operand + carry);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0x6D: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 4;
                this._regPC.add(2);
                break;
            case 0x65: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 3;
                this._regPC.add(1);
                break;
            case 0x7D: // Absolute Indexed, X
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += (4 + pageBoundaryCycle);
                this._regPC.add(2);
                break;
            case 0x79: // Absolute Indexed, Y
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += (4 + pageBoundaryCycle);
                this._regPC.add(2);
                break;
            case 0x75: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 4;
                this._regPC.add(1);
                break;
            case 0x61: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 6;
                this._regPC.add(1);
                break;
            case 0x71: // Direct Page Indirect Indexed, Y
                if(this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles+= (5 + pageBoundaryCycle);
                this._regPC.add(1);
                break;
        }

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isOverflow(oldA, operand, this._regA.get(), true)) {
            this.setStatusBit(StatusBitPositions.Overflow);
        } else {
            this.clearStatusBit(StatusBitPositions.Overflow);
        }

        if(this._regA.get() === 0) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(this.isCarry(oldA, operand, carry, true)) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }
    }

    public and(opCode: number) {
        let address = 0;
        let operand = 0;
        let pageBoundaryCycle = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0x29:
                operand = this._memRead(this._regPC.get());
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 2;
                this._regPC.add(1);
                break;
            case 0x2D:
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
            case 0x3D:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += (4 + pageBoundaryCycle);
                this._regPC.add(2);
                break;
            case 0x39:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += (4 + pageBoundaryCycle);
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
                pageBoundaryCycle = this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY) ? 1 : 0;
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += (5 + pageBoundaryCycle);
                this._regPC.add(1);
                break;
        }

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public asl(opCode: number) {
        let oldVal = 0;
        let result = 0;
        let address = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0x0A:
                oldVal = this._regA.get();
                result = oldVal << 1;
                
                this._regA.set(result);
                this._currentCycles += 2;
                break;
            case 0x0E:
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
            case 0x1E:
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

        if((oldVal & 0x80) === 0x80) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }

        if(this.isNegative(result & 0xFF)) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(result & 0xFF)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public bcc(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0x90:
                let displacement = this._memRead(this._regPC.get()) & 0xFF;
                if(displacement >= 0x80) {
                    displacement = -(0xFF - displacement + 0x1);
                }

                if(!this.getStatusBitFlag(StatusBitPositions.Carry)) {
                    const pcPageBoundaryByte = ((this._regPC.get() + 1) & 0xFF00);
                    
                    this._regPC.add(displacement + 1);

                    // Page boundary crossed?
                    if(pcPageBoundaryByte !== (this._regPC.get() & 0xFF00)) {
                        this._currentCycles += 1;
                    }
                            
                    this._currentCycles += 1;
                } else {
                    // Move onto the next.
                    this._regPC.add(1);
                }
                this._currentCycles += 2;

                break;
        }
    }

    public bcs(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0xB0:
                let displacement = this._memRead(this._regPC.get()) & 0xFF;
                if(displacement >= 0x80) {
                    displacement = -(0xFF - displacement + 0x1);
                }
    
                if(this.getStatusBitFlag(StatusBitPositions.Carry)) {
                    const pcPageBoundaryByte = ((this._regPC.get() + 1) & 0xFF00);

                    this._regPC.add(displacement + 1);
        
                    // Page boundary crossed?
                    if(pcPageBoundaryByte !== (this._regPC.get() & 0xFF00)) {
                        this._currentCycles += 1;
                    }
                            
                    this._currentCycles += 1;
                } else {
                    this._regPC.add(1);
                }

                this._currentCycles += 2;
                break;
        }
    }

    public beq(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0xF0:
                let displacement = this._memRead(this._regPC.get()) & 0xFF;
                if(displacement >= 0x80) {
                    displacement = -(0xFF - displacement + 0x1);
                }

                if(this.getStatusBitFlag(StatusBitPositions.Zero)) {
                    const pcPageBoundaryByte = ((this._regPC.get() + 1) & 0xFF00);

                    this._regPC.add(displacement + 1);
        
                    // Page boundary crossed?
                    if(pcPageBoundaryByte !== (this._regPC.get() & 0xFF00)) {
                        this._currentCycles += 1;
                    }
                            
                    this._currentCycles += 1;
                } else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    }

    public bit(opCode: number) {
        let address = 0;
        let operand = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0x2C: // Absolute Addressing
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);

                if((operand & 0x80) > 0) {
                    this.setStatusBit(StatusBitPositions.Negative);
                } else {
                    this.clearStatusBit(StatusBitPositions.Negative);
                }

                if((operand & 0x40) > 0) {
                    this.setStatusBit(StatusBitPositions.Overflow);
                } else {
                    this.clearStatusBit(StatusBitPositions.Overflow);
                }

                if((operand & this._regA.get()) === 0) {
                    this.setStatusBit(StatusBitPositions.Zero);
                } else {
                    this.clearStatusBit(StatusBitPositions.Zero);
                }
                
                this._currentCycles += 4;
                this._regPC.add(2);
                break;
            case 0x24: // Direct Page Addressing
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);

                if(this.isNegative(operand)) {
                    this.setStatusBit(StatusBitPositions.Negative);
                } else {
                    this.clearStatusBit(StatusBitPositions.Negative);
                }

                if((operand & 0x40) > 0) {
                    this.setStatusBit(StatusBitPositions.Overflow);
                } else {
                    this.clearStatusBit(StatusBitPositions.Overflow);
                }

                if((operand & this._regA.get()) === 0) {
                    this.setStatusBit(StatusBitPositions.Zero);
                } else {
                    this.clearStatusBit(StatusBitPositions.Zero);
                }

                this._currentCycles += 3;
                this._regPC.add(1);
                break;
        }
    }

    public bmi(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0x30:
                let displacement = this._memRead(this._regPC.get()) & 0xFF;
                if(displacement >= 0x80) {
                    displacement = -(0xFF - displacement + 0x1);
                }

                
                if(this.getStatusBitFlag(StatusBitPositions.Negative)) {
                    const pcPageBoundaryByte = ((this._regPC.get() + 1) & 0xFF00);

                    this._regPC.add(displacement + 1);
        
                    // Page boundary crossed?
                    if(pcPageBoundaryByte !== (this._regPC.get() & 0xFF00)) {
                        this._currentCycles += 1;
                    }
                            
                    this._currentCycles += 1;
                } else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    }

    public bne(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0xD0:
                let displacement = this._memRead(this._regPC.get()) & 0xFF;
                if(displacement >= 0x80) {
                    displacement = -(0xFF - displacement + 0x1);
                }

                if(!this.getStatusBitFlag(StatusBitPositions.Zero)) {
                    const pcPageBoundaryByte = ((this._regPC.get() + 1) & 0xFF00);

                    this._regPC.add(displacement + 1);
        
                    // Page boundary crossed?
                    if(pcPageBoundaryByte !== (this._regPC.get() & 0xFF00)) {
                        this._currentCycles += 1;
                    }
                            
                    this._currentCycles += 1;
                } else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    }

    public bpl(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0x10: 
                let displacement = this._memRead(this._regPC.get()) & 0xFF;
                if(displacement >= 0x80) {
                    displacement = -(0xFF - displacement + 0x1);
                }

                
                if(!this.getStatusBitFlag(StatusBitPositions.Negative)) {
                    const pcPageBoundaryByte = ((this._regPC.get() + 1) & 0xFF00);

                    this._regPC.add(displacement + 1);
        
                    // Page boundary crossed?
                    if(pcPageBoundaryByte !== (this._regPC.get() & 0xFF00)) {
                        this._currentCycles += 1;
                    }
                            
                    this._currentCycles += 1;
                } else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    }

    public brk(opCode: number) {
        this._regPC.add(2);
        switch(opCode) {
            case 0x00:
                this.stackPush((this._regPC.get() | 0xFF00) >> 8);
                this.stackPush((this._regPC.get() | 0x00FF));

                this.setStatusBit(StatusBitPositions.BrkCausedInterrupt);
                this.stackPush(this._regP.get() | 0x10);
                this.setStatusBit(StatusBitPositions.InterruptDisable);
                
                let interruptVectorLow = this._memRead(IrqVectorLocation.Low);
                let interruptVectorHigh = this._memRead(IrqVectorLocation.High);

                this._regPC.set((interruptVectorHigh << 8) | interruptVectorLow);

                this._currentCycles += 7;
                break;
            default:
                console.error(`ERROR: Unhandled BRK opcode! ${opCode}`);
                break;
        }
    }

    public bvc(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0x50:
                let displacement = this._memRead(this._regPC.get()) & 0xFF;
                if(displacement >= 0x80) {
                    displacement = -(0xFF - displacement + 0x1);
                }

                if(!this.getStatusBitFlag(StatusBitPositions.Overflow)) {
                    const pcPageBoundaryByte = ((this._regPC.get() + 1) & 0xFF00);

                    this._regPC.add(displacement + 1);
            
                    // Page boundary crossed?
                    if(pcPageBoundaryByte !== (this._regPC.get() & 0xFF00)) {
                        this._currentCycles += 1;
                    }
                            
                    this._currentCycles += 1;
                } else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    }

    public bvs(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0x70:
                let displacement = this._memRead(this._regPC.get()) & 0xFF;
                if(displacement >= 0x80) {
                    displacement = -(0xFF - displacement + 0x1);
                }

                if(this.getStatusBitFlag(StatusBitPositions.Overflow)) {
                    const pcPageBoundaryByte = ((this._regPC.get() + 1) & 0xFF00);

                    this._regPC.add(displacement + 1);
        
                    // Page boundary crossed?
                    if(pcPageBoundaryByte !== (this._regPC.get() & 0xFF00)) {
                        this._currentCycles += 1;
                    }
                            
                    this._currentCycles += 1;
                } else {
                    this._regPC.add(1);
                }
                this._currentCycles += 2;
                break;
        }
    }

    public clc(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0x18:
                this.clearStatusBit(StatusBitPositions.Carry);
                this._currentCycles += 2;
                break;
        }
    }

    public cld(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0xD8:
                this.clearStatusBit(StatusBitPositions.DecimalMode);
                this._currentCycles += 2;
                break;
        }
    }

    public cli(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0x58:
                this.clearStatusBit(StatusBitPositions.InterruptDisable);
                this._currentCycles += 2;
                break;
        }
    }

    public clv(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0xB8:
                this.clearStatusBit(StatusBitPositions.Overflow);
                this._currentCycles += 2;
                break;
        }
    }

    public cmp(opCode: number) {
        let operand = 0;
        let address = 0;
        let carry = 0;
        let pageBoundaryCycle = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0xC9: // Immediate
                operand = this._memRead(this._regPC.get());
                
                if(this._regA.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._currentCycles += 2;
                this._regPC.add(1);
                break;
            case 0xCD: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                if(this._regA.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._currentCycles += 4;
                this._regPC.add(2);
                break;
            case 0xC5: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                if(this._regA.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._currentCycles += 3;
                this._regPC.add(1);
                break;
            case 0xDD: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                if(this._regA.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._currentCycles += (4 + pageBoundaryCycle);
                this._regPC.add(2);
                break;
            case 0xD9: // Absolute Indexed Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                if(this._regA.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._currentCycles += (4 + pageBoundaryCycle);
                this._regPC.add(2);
                break;
            case 0xD5: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                if(this._regA.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._currentCycles += 4;
                this._regPC.add(1);
                break;
            case 0xC1: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                if(this._regA.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._currentCycles += 6;
                this._regPC.add(1);
                break;
            case 0xD1: // Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                } 
                operand = this._memRead(address);
                
                if(this._regA.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._currentCycles += (5 + pageBoundaryCycle);
                this._regPC.add(1);
                break;
        }

        if(this.isNegative(this._regA.get() - operand)) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regA.get() - operand)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(carry === 1) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }
    }

    public cpx(opCode: number) {
        let address = 0;
        let operand = 0;
        let carry = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0xE0: // Immediate
                operand = this._memRead(this._regPC.get());
                
                if(this._regX.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xEC: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                if(this._regX.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xE4: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                if(this._regX.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
        }

        if(this.isNegative(this._regX.get() - operand)) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regX.get() - operand)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(carry === 1) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }
    }

    public cpy(opCode: number) {
        let address = 0;
        let operand = 0;
        let carry = 0;

        this._regPC.add(1);

        switch(opCode) {
            case 0xC0: // Immediate
                operand = this._memRead(this._regPC.get());
                
                if(this._regY.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xCC: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                if(this._regY.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xC4: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                if(this._regY.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
        }

        if(this.isNegative(this._regY.get() - operand)) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regY.get() - operand)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(carry === 1) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }
    }

    public dcp(opcode: number) {
        let address = 0;
        let operand = 0;
        let carry = 0;

        // DEC then CMP
        this._regPC.add(1);

        switch(opcode) {
            case 0xC3:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                operand--;

                this._memWrite(address, operand);

                if(this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 8;    
                break;
            case 0xC7:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                operand--;

                this._memWrite(address, operand);

                if(this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 5;    
                break;            
            case 0xCF:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                operand--;

                this._memWrite(address, operand);

                if(this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += 6;    
                break;
            case 0xD3:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                operand--;

                this._memWrite(address, operand);

                if(this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += (8);    
                break;
            case 0xD7:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                operand--;

                this._memWrite(address, operand);

                if(this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 6;    
                break;
            case 0xDB:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                operand--;

                this._memWrite(address, operand);

                if(this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += (7);    
                break;
            case 0xDF:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                operand--;

                this._memWrite(address, operand);

                if(this._regA.get() >= this._memRead(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += (7);    
                break;
        }

        if(this.isNegative(this._regA.get() - this._memRead(address))) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regA.get() - this._memRead(address))) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(carry === 1) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }
    }

    public dec(opCode: number) {
        let address = 0;
        let operand = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0xCE: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                this._memWrite(address, operand - 1);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0xC6: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                this._memWrite(address, operand - 1);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0xDE: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                this._memWrite(address, operand - 1);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0xD6: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                this._memWrite(address, operand - 1);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }

        if(this.isNegative(this._memRead(address))) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._memRead(address))) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public dex(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0xCA:
                this._regX.set(this._regX.get() - 1);
                this._currentCycles += 2;
                break;
        }

        if(this.isNegative(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public dey(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0x88:
                this._regY.set(this._regY.get() - 1);
                this._currentCycles += 2;
                break;
        }

        if(this.isNegative(this._regY.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regY.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public eor(opCode: number) {
        let address = 0;
        let operand = 0;
        let result = 0;
        let pageBoundaryCycle = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0x49: // Immediate
                operand = this._memRead(this._regPC.get());
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0x4D: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x45: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x5D: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0x59: // Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0x55: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0x41: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x51: // Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += (5 + pageBoundaryCycle);
                break;
        }

        if(this.isNegative(result)) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(result)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public inc(opCode: number) {
        let address = 0;
        let operand = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0xEE: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                this._memWrite(address, operand + 1);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0xE6: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                this._memWrite(address, operand + 1);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0xFE: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                this._memWrite(address, operand + 1);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0xF6: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                this._memWrite(address, operand + 1);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }

        if(this.isNegative(this._memRead(address))) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._memRead(address))) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public inx(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0xE8:
                this._regX.set(this._regX.get() + 1);
                this._currentCycles += 2;
                break;
        }

        if(this.isNegative(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public iny(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0xC8:
                this._regY.set(this._regY.get() + 1);
                this._currentCycles += 2;
                break;
        }

        if(this.isNegative(this._regY.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regY.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public isb(opcode: number) {
        let address = 0;
        let operand = 0;
        let result = 0;
        let oldA = this._regA.get();
        // Subtract 1 more if carry is clear!
        let currentCarry = !this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;

        this._regPC.add(1);

        // INC then SBC
        switch(opcode) {
            case 0xE3:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);

                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0xE7:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);

                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(1);
                this._currentCycles += 5;          
                break;  
            case 0xEF:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);

                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(2);
                this._currentCycles += 6;          
                break;  
            case 0xF3:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);

                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(1);
                this._currentCycles += 8;          
                break;             
            case 0xF7:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);

                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(1);
                this._currentCycles += 6;          
                break;         
            case 0xFB:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                operand++;
                this._memWrite(address, operand);

                result = oldA - this._memRead(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(2);
                this._currentCycles += 7;          
                break;               
            case 0xFF:
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

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isOverflow(oldA, this._memRead(address), this._regA.get(), false)) {
            this.setStatusBit(StatusBitPositions.Overflow);
        } else {
            this.clearStatusBit(StatusBitPositions.Overflow);
        }

        if(this.isZero(result)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(this.isCarry(oldA, this._memRead(address), currentCarry, false)) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }
    }

    public jmp(opCode: number) {
        let address = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0x4C:
                address = this._addressingHelper.atAbsolute(this._regPC);                
                this._regPC.set(address);
                this._currentCycles += 3;
                break;
            case 0x6C:
                address = this._addressingHelper.atAbsoluteIndirect(this._regPC);
                if((this._regPC.get() & 0x00FF) === 0x00FF) {
                    this._currentCycles += 1;
                }
                this._regPC.set(address);
                this._currentCycles += 5;
                break;
        }
    }

    public jsr(opCode: number) {
        this._regPC.add(1);

        switch(opCode) {
            case 0x20: // Absolute
                let address = this._addressingHelper.atAbsolute(this._regPC);
                this._regPC.add(1);
                this.stackPush((this._regPC.get() & 0xFF00) >> 8);
                this.stackPush((this._regPC.get() & 0x00FF));
                this._regPC.set(address);
                this._currentCycles += 6;
                break;
        }
    }

    public lax(opcode: number) {
        let address = 0;
        let operand = 0;

        this._regPC.add(1);
        switch(opcode) {
            case 0xA3: // Direct Indirect X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0xA7:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xAF:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xB3:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    this._currentCycles++;
                }
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0xB7:
                address = this._addressingHelper.atDirectPageIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0xBF:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    this._currentCycles++;
                }
                operand = this._memRead(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(2);
                this._currentCycles += 4;
                break;            
        }

        if(this.isNegative(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

    }

    public lda(opCode: number) {
        let address = 0;
        let operand = 0;
        let pageBoundaryCycle = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0xA9: // Immediate
                operand = this._memRead(this._regPC.get());
                
                this._currentCycles += 2;
                this._regA.set(operand);
                this._regPC.add(1);
                break;
            case 0xAD: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                this._regA.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xA5: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xBD: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                this._regA.set(operand);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0xB9: // Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                this._regA.set(operand);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0xB5: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0xA1: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0xB1: // Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += (5 + pageBoundaryCycle);
                break;
        }

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public ldx(opCode: number) {
        let operand = 0;
        let address = 0;
        let pageBoundaryCycle = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0xA2: // Immediate
                operand = this._memRead(this._regPC.get());
                
                this._regX.set(operand);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xAE: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                this._regX.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xA6: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                this._regX.set(operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xBE: // Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                this._regX.set(operand);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0xB6: // Direct Page Indexed, Y
                address = this._addressingHelper.atDirectPageIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                
                this._regX.set(operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
        }

        if(this.isNegative(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public ldy(opcode: number) {
        let operand = 0;
        let address = 0;
        let pageBoundaryCycle = 0;

        this._regPC.add(1);
        switch(opcode) {
            case 0xA0: // Immediate
                operand = this._memRead(this._regPC.get());
                
                this._regY.set(operand);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xAC: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                this._regY.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xA4: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                this._regY.set(operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xBC: // Absolute Indexed X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                this._regY.set(operand);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0xB4: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                this._regY.set(operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
        }

        if(this.isNegative(this._regY.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regY.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public lsr(opcode: number) {
        let address = 0;
        let operand = 0;
        let carry = 0;
        let result = 0;

        this._regPC.add(1);
        
        switch(opcode) {
            case 0x4A: // Accumulator
                operand = this._regA.get();
                
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._regA.set(result);
                this._currentCycles += 2;
                break;
            case 0x4E: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x46: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x5E: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x56: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;            
        }

        if(this.isNegative(result & 0xFF)) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(result & 0xFF)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(carry === 1) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }
    }

    public nop(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x1A:
            case 0x3A:
            case 0x5A:
            case 0x7A:
            case 0xDA:
            case 0xFA:
            case 0xEA:
                this._currentCycles += 2;
                break;
        }
    }

    public skb(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x80:
            case 0x82:
            case 0x89:
            case 0xC2:
            case 0xE2:
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
        }
    }

    public ign(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x0C:
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x1C:
            case 0x3C:
            case 0x5C:
            case 0x7C:
            case 0xDC:
            case 0xFC:
                let pageBoundaryCycle = 0;
                
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
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
            case 0xD4:
            case 0xF4:
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
        }
    }

    public ora(opcode: number) {
        let address = 0;
        let operand = 0;
        let result = 0;
        let pageBoundaryCycle = 0;
        
        this._regPC.add(1)
        switch(opcode) {
            case 0x09: // Immediate
                operand = this._memRead(this._regPC.get());
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0x0D: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x05: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x1D: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0x19: // Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0x15: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0x01: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x11: // Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += (5 + pageBoundaryCycle);
                break;
        }

        if(this.isNegative(result)) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(result)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public pha(opcode: number) {
        this._regPC.add(1);
        switch(opcode) { 
            case 0x48:
                this.stackPush(this._regA.get());
                this._currentCycles += 3;
                break;
        }
    }

    public php(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x08:
                let pStatus = this._regP.get() | 0x10;
                this.stackPush(pStatus);
                this._currentCycles += 3;
                break;
        }
    }

    public pla(opcode: number) {
        this._regPC.add(1);

        switch(opcode) {
            case 0x68:
                this._regA.set(this.stackPull());
                this._currentCycles += 4;
                break;
        }

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public plp(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x28:
                let pStatus = this.stackPull();
                pStatus = pStatus | 0x20;
                this._regP.set(pStatus);
                this.clearStatusBit(StatusBitPositions.BrkCausedInterrupt);
                this._currentCycles += 4;
                break;
        }
    }

    public rla(opcode: number) {
        let address = 0;
        let operand = 0;
        let newCarry = 0;
        let oldCarry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;


        this._regPC.add(1);

        // ROL and AND
        switch(opcode) {
            case 0x23:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);

                operand = this._memRead(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memWrite(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memRead(address));

                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x27:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memWrite(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x2F:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memWrite(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x33:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memWrite(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x37:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memWrite(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x3B:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memWrite(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x3F:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memWrite(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memRead(address));
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
        }

        if(newCarry === 1) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public rol(opcode: number) {
        let operand = 0;
        let address = 0;
        let result = 0;
        let oldCarry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;
        let newCarry = 0;

        this._regPC.add(1);
        switch(opcode) {
            case 0x2A: // Accumulator
                operand = this._regA.get();
                
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;
                result = ((operand << 1) | oldCarry);
                this._regA.set(result);
                this._currentCycles += 2;
                break;
            case 0x2E: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;
                result = ((operand << 1) | oldCarry);
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x26: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;
                result = ((operand << 1) | oldCarry);
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x3E: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;
                result = ((operand << 1) | oldCarry);
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x36: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;
                result = ((operand << 1) | oldCarry);
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }

        if(this.isNegative(result & 0xFF)) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(result & 0xFF)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(newCarry === 1) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }
    }

    public ror(opcode: number) {
        let operand = 0;
        let address = 0;
        let result = 0;
        let oldCarry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;
        let newCarry = 0;

        this._regPC.add(1);
        switch(opcode) {
            case 0x6A: // Accumulator
                operand = this._regA.get();
                
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;
                result = ((operand >> 1) | (oldCarry << 7));
                this._regA.set(result);
                this._currentCycles += 2;
                break;
            case 0x6E: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;
                result = ((operand >> 1) | (oldCarry << 7));
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x66: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;
                result = ((operand >> 1) | (oldCarry << 7));
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x7E: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;
                result = ((operand >> 1) | (oldCarry << 7));
                this._memWrite(address, result);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x76: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;
                result = ((operand >> 1) | (oldCarry << 7));
                this._memWrite(address, result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }

        if(this.isNegative(result & 0xFF)) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(result & 0xFF)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(newCarry === 1) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }
    }

    public rra(opcode: number) {
        let address = 0;
        let operand = 0;
        let oldCarry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;
        let newCarry = 0;
        let oldA = 0;

        // ROR and then ADC
        this._regPC.add(1);
        switch(opcode) {
            case 0x63:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);

                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;

                operand = ((operand >> 1) | (oldCarry << 7));
                this._memWrite(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
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
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memWrite(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                // adc time
                oldA = this._regA.get();

                this._regA.set(this._regA.get() + this._memRead(address) + newCarry);

                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x6F:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memWrite(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
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
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memWrite(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
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
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memWrite(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                // adc time
                oldA = this._regA.get();

                this._regA.set(this._regA.get() + this._memRead(address) + newCarry);

                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x7B:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memWrite(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                // adc time
                oldA = this._regA.get();

                this._regA.set(this._regA.get() + this._memRead(address) + newCarry);

                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x7F:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memWrite(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                // adc time
                oldA = this._regA.get();

                this._regA.set(this._regA.get() + this._memRead(address) + newCarry);

                this._regPC.add(2);
                this._currentCycles += 7;
                break;
        }

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isOverflow(oldA, this._memRead(address), this._regA.get(), true)) {
            this.setStatusBit(StatusBitPositions.Overflow);
        } else {
            this.clearStatusBit(StatusBitPositions.Overflow);
        }

        if(this._regA.get() === 0) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(this.isCarry(oldA, this._memRead(address), newCarry, true)) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }
    }

    public rti(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x40:
                const newP = this.stackPull();
                const pcLow = this.stackPull();
                const pcHigh = this.stackPull();

                this._regPC.set((pcHigh << 8) | pcLow);
                this._regP.set(newP);

                this.clearStatusBit(StatusBitPositions.BrkCausedInterrupt);
                this.setStatusBit(StatusBitPositions.Bit5);

                this._currentCycles += 6;
                break;
        }
    }

    public rts(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x60:
                const newLowPC = this.stackPull();
                const newHighPC = this.stackPull();

                this._regPC.set((newHighPC << 8) | newLowPC);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }
    }

    public sax(opcode: number) {
        let address = 0;

        this._regPC.add(1);
        switch(opcode) {
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
            case 0x8F:
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
    }

    public sbc(opcode: number) {
        let address = 0;
        let operand = 0;
        let result = 0;
        let pageBoundaryCycle = 0;
        let oldA = this._regA.get();
        // Subtract 1 more if carry is clear!
        let currentCarry = !this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;

        this._regPC.add(1);

        switch(opcode) {
            case 0xEB:
            case 0xE9: // Immediate
                operand = this._memRead(this._regPC.get());
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xED: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xE5: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memRead(address);
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xFD: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0xF9: // Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0xF5: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0xE1: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);
                // 
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0xF1: // Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memRead(address);
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += (5 + pageBoundaryCycle);
                break;
        }

        if(this.isNegative(result)) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isOverflow(oldA, operand, result, false)) {
            this.setStatusBit(StatusBitPositions.Overflow);
        } else {
            this.clearStatusBit(StatusBitPositions.Overflow);
        }

        if(this.isZero(result)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(this.isCarry(oldA, operand, currentCarry, false)) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }
    }

    public sec(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x38:
                this.setStatusBit(StatusBitPositions.Carry);
                this._currentCycles += 2;
                break;
        }
    }

    public sed(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0xF8:
                this.setStatusBit(StatusBitPositions.DecimalMode);
                this._currentCycles += 2;
                break;
        }
    }

    public sei(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x78:
                this.setStatusBit(StatusBitPositions.InterruptDisable);
                this._currentCycles += 2;
                break;
        }
    }

    public slo(opcode: number) {
        let address = 0;
        let operand = 0;

        this._regPC.add(1);

        switch(opcode) {
            case 0x03:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memRead(address);

                if((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
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

                if((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                operand <<= 1;
                this._memWrite(address, operand);

                this._regA.set(this._regA.get() | this._memRead(address));

                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x0F:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memRead(address);

                if((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
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

                if((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
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

                if((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                operand <<= 1;
                this._memWrite(address, operand);

                this._regA.set(this._regA.get() | this._memRead(address));

                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x1B:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);

                if((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                operand <<= 1;
                this._memWrite(address, operand);

                this._regA.set(this._regA.get() | this._memRead(address));

                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x1F:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memRead(address);

                if((this._memRead(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                operand <<= 1;
                this._memWrite(address, operand);

                this._regA.set(this._regA.get() | this._memRead(address));

                this._regPC.add(2);
                this._currentCycles += 7;
                break;
        }

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public sre(opcode: number) {
        let address = 0;
        let operand = 0;
        let carry = 0;

        this._regPC.add(1);

        switch(opcode) {
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
            case 0x4F:
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
            case 0x5B:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memRead(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;

                operand = operand >> 1;
                this._memWrite(address, operand);

                this._regA.set(this._regA.get() ^ this._memRead(address));

                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x5F:
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

        if(carry === 1) {
            this.setStatusBit(StatusBitPositions.Carry);
        } else {
            this.clearStatusBit(StatusBitPositions.Carry);
        }

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public sta(opcode: number) {
        let operand = 0;
        let address = 0;

        this._regPC.add(1);
        switch(opcode) {
            case 0x8D: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x85: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x9D: // Absolute Indexed X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(2);
                this._currentCycles += 5;
                break;
            case 0x99: // Absolute Indexed Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(2);
                this._currentCycles += 5;
                break;
            case 0x95: // Direct Page Indexed X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0x81: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x91: // Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._regA.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
        }
    }

    public stx(opcode: number) {
        let address = 0;
        let operand = 0;

        this._regPC.add(1);
        switch(opcode) {
            case 0x8E: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._regX.get();
                this._memWrite(address, operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x86: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._regX.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x96: // Direct Page Indexed, Y
                address = this._addressingHelper.atDirectPageIndexedY(this._regPC, this._regY);
                operand = this._regX.get();
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
        }
    }

    public sty(opcode: number) {
        let address = 0;
        let operand = 0;

        this._regPC.add(1);
        switch(opcode) {
            case 0x8C: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._regY.get();
                
                this._memWrite(address, operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x84: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._regY.get();
                
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x94: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._regY.get();
                
                this._memWrite(address, operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
        }
    }

    public tax(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0xAA:
                this._regX.set(this._regA.get());
                this._currentCycles += 2;
                break;
        }

        if(this.isNegative(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public tay(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0xA8:
                this._regY.set(this._regA.get());
                this._currentCycles += 2;
                break;
        }

        if(this.isNegative(this._regY.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regY.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public tsx(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0xBA:
                this._regX.set(this._regSP.get());
                this._currentCycles += 2;
                break;
        }

        if(this.isNegative(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regX.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public txa(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x8A:
                this._regA.set(this._regX.get());
                this._currentCycles += 2;
                break;
        }

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public txs(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x9A:
                this._regSP.set(this._regX.get());
                this._currentCycles += 2;
                break;
        }
    }

    public tya(opcode: number) {
        this._regPC.add(1);
        switch(opcode) {
            case 0x98:
                
                this._regA.set(this._regY.get());
                this._currentCycles += 2;
                break;
        }

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }
    }

    public handleOp(opCode: number) {
        if(this._dbg) {
            const logEntry = this.getLogEntry(opCode);
            this._log.push(logEntry);
            console.log(logEntry);
        }

        switch(opCode) {
            case 0x00:
                this.brk(opCode);
                break;
            case 0x01:
            case 0x05:
            case 0x09:
            case 0x0D:
            case 0x11:
            case 0x15:
            case 0x19:
            case 0x1D:
                this.ora(opCode);
                break;
            case 0x06:
            case 0x0A:
            case 0x0E:
            case 0x16:
            case 0x1E:
                this.asl(opCode);
                break;
            case 0x08:
                this.php(opCode);
                break;
            case 0x0C:
            case 0x1C:
            case 0x3C:
            case 0x5C:
            case 0x7C:
            case 0xDC:
            case 0xFC:
            case 0x04:
            case 0x44:
            case 0x64:
            case 0x14:
            case 0x34:
            case 0x54:
            case 0x74:
            case 0xD4:
            case 0xF4:
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
            case 0x2D:
            case 0x31:
            case 0x35:
            case 0x39:
            case 0x3D:
                this.and(opCode);
                break;
            case 0x24:
            case 0x2C:
                this.bit(opCode);
                break;
            case 0x26:
            case 0x2A:
            case 0x2E:
            case 0x36:
            case 0x3E:
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
            case 0x4D:
            case 0x51:
            case 0x55:
            case 0x59:
            case 0x5D:
                this.eor(opCode);
                break;
            case 0x46:
            case 0x4A:
            case 0x4E:
            case 0x56:
            case 0x5E:
                this.lsr(opCode);
                break;
            case 0x48:
                this.pha(opCode);
                break;
            case 0x4C:
            case 0x6C:
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
            case 0x6D:
            case 0x71:
            case 0x75:
            case 0x79:
            case 0x7D:
                this.adc(opCode);
                break;
            case 0x66:
            case 0x6A:
            case 0x6E:
            case 0x76:
            case 0x7E:
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
            case 0x8D:
            case 0x91:
            case 0x95:
            case 0x99:
            case 0x9D:
                this.sta(opCode);
                break;
            case 0x84:
            case 0x8C:
            case 0x94:
                this.sty(opCode);
                break;
            case 0x86:
            case 0x8E:
            case 0x96:
                this.stx(opCode);
                break;
            case 0x88:
                this.dey(opCode);
                break;
            case 0x8A:
                this.txa(opCode);
                break;
            case 0x90:
                this.bcc(opCode);
                break;
            case 0x98:
                this.tya(opCode);
                break;
            case 0x9A:
                this.txs(opCode);
                break;
            case 0xA0:
            case 0xA4:
            case 0xAC:
            case 0xB4:
            case 0xBC:
                this.ldy(opCode);
                break;
            case 0xA1:
            case 0xA5:
            case 0xA9:
            case 0xAD:
            case 0xB1:
            case 0xB5:
            case 0xB9:
            case 0xBD:
                this.lda(opCode);
                break;
            case 0xA2:
            case 0xA6:
            case 0xAE:
            case 0xB6:
            case 0xBE:
                this.ldx(opCode);
                break;
            case 0xA8:
                this.tay(opCode);
                break;
            case 0xAA:
                this.tax(opCode);
                break;
            case 0xB0:
                this.bcs(opCode);
                break;
            case 0xB8:
                this.clv(opCode);
                break;
            case 0xBA:
                this.tsx(opCode);
                break;
            case 0xC0:
            case 0xC4:
            case 0xCC:
                this.cpy(opCode);
                break;
            case 0xC1: 
            case 0xC5:
            case 0xC9:
            case 0xCD:
            case 0xD1:
            case 0xD5:
            case 0xD9:
            case 0xDD:
                this.cmp(opCode);
                break;
            case 0xC6:
            case 0xCE:
            case 0xD6:
            case 0xDE:
                this.dec(opCode);
                break;
            case 0xC8:
                this.iny(opCode);
                break;
            case 0xCA:
                this.dex(opCode);
                break;
            case 0xD0:
                this.bne(opCode);
                break;
            case 0xD8:
                this.cld(opCode);
                break;
            case 0xE0:
            case 0xE4:
            case 0xEC:
                this.cpx(opCode);
                break;
            case 0xE1:
            case 0xE5:
            case 0xEB:
            case 0xE9:
            case 0xED:
            case 0xF1:
            case 0xF5:
            case 0xF9:
            case 0xFD:
                this.sbc(opCode);
                break;
            case 0xE6:
            case 0xEE:
            case 0xF6:
            case 0xFE:
                this.inc(opCode);
                break;
            case 0xE8:
                this.inx(opCode);
                break;
            case 0x1A:
            case 0x3A:
            case 0x5A:
            case 0x7A:
            case 0xDA:
            case 0xFA:
            case 0xEA:
                this.nop(opCode);
                break;
            case 0x80:
            case 0x82:
            case 0x89:
            case 0xC2:
            case 0xE2:
                this.skb(opCode);
                break;
            case 0xF0:
                this.beq(opCode);
                break;
            case 0xF8:
                this.sed(opCode);
                break;
            case 0xA3:
            case 0xA7:
            case 0xAF:
            case 0xB3:
            case 0xB7:
            case 0xBF:
                this.lax(opCode);
                break;
            case 0x83:
            case 0x87:
            case 0x8F:
            case 0x97:
                this.sax(opCode);
                break;
            case 0xC3:
            case 0xC7:
            case 0xCF:
            case 0xD3:
            case 0xD7:
            case 0xDB:
            case 0xDF:
                this.dcp(opCode);
                break;
            case 0xE3:
            case 0xE7:
            case 0xEF:
            case 0xF3:
            case 0xF7:
            case 0xFB:
            case 0xFF:
                this.isb(opCode);
                break;
            case 0x03:
            case 0x07:
            case 0x0F:
            case 0x13:
            case 0x17:
            case 0x1B:
            case 0x1F:
                this.slo(opCode);
                break;
            case 0x23:
            case 0x27:
            case 0x2F:
            case 0x33:
            case 0x37:
            case 0x3B:
            case 0x3F:
                this.rla(opCode);
                break;
            case 0x43:
            case 0x47:
            case 0x4F:
            case 0x53:
            case 0x57:
            case 0x5B:
            case 0x5F:
                this.sre(opCode);
                break;
            case 0x63:
            case 0x67:
            case 0x6F:
            case 0x73:
            case 0x77:
            case 0x7B:
            case 0x7F:
                this.rra(opCode);
                break;
            default: 
                break;
        }
    }
}

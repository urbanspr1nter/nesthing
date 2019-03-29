import { ByteRegister } from './byte-register';
import { DoubleByteRegister } from './double-byte-register';
import { Memory } from '../memory/memory';
import { CpuAddressingHelper } from './cpu-addressing-helper';

enum StatusBitPositions {
    Carry = 0,
    Zero = 1,
    InterruptDisable = 2,
    DecimalMode = 3,
    BrkCausedInterrupt = 4,
    Bit5 = 5,
    Overflow = 6,
    Negative = 7
};

const OpLabel: any = {
    0x00: 'BRK', 0x01: 'ORA', 0x02: '---', 0x03: '---', 0x04: '---', 0x05: 'ORA', 0x06: '---', 0x07: '---',
    0x08: 'PHP', 0x09: 'ORA', 0x0A: 'ASL', 0x0B: '---', 0x0C: 'IGN', 0x0D: 'ORA', 0x0E: 'ASL', 0x0F: '---',
    0x10: 'BPL', 0x11: 'ORA', 0x12: '---', 0x13: 'SLO', 0x14: 'IGN', 0x15: 'ORA', 0x16: 'ASL', 0x17: 'SLO',
    0x18: 'CLC', 0x19: 'ORA', 0x1A: 'NOP', 0x1B: 'SLO', 0x1C: 'IGN', 0x1D: 'ORA', 0x1E: 'ASL', 0x1F: 'SLO',
    0x20: 'JSR', 0x21: 'AND', 0x22: '---', 0x23: 'RLA', 0x24: 'BIT', 0x25: 'AND', 0x26: 'ROL', 0x27: 'RLA',
    0x28: 'PLP', 0x29: 'AND', 0x2A: 'ROL', 0x2B: '---', 0x2C: 'BIT', 0x2D: 'AND', 0x2E: 'ROL', 0x2F: 'RLA',
    0x30: 'BMI', 0x31: 'AND', 0x32: '---', 0x33: 'RLA', 0x34: 'IGN', 0x35: 'AND', 0x36: 'ROL', 0x37: '---',
    0x38: 'SEC', 0x39: 'AND', 0x3A: 'NOP', 0x3B: 'RLA', 0x3C: 'IGN', 0x3D: 'AND', 0x3E: 'ROL', 0x3F: 'RLA',
    0x40: 'RTI', 0x41: 'EOR', 0x42: '---', 0x43: 'SRE', 0x44: 'IGN', 0x45: 'EOR', 0x46: 'LSR', 0x47: 'SRE',
    0x48: 'PHA', 0x49: 'EOR', 0x4A: 'LSR', 0x4B: '---', 0x4C: 'JMP', 0x4D: 'EOR', 0x4E: 'LSR', 0x4F: 'SRE',
    0x50: 'BVC', 0x51: 'EOR', 0x52: '---', 0x53: 'SRE', 0x54: 'IGN', 0x55: 'EOR', 0x56: 'LSR', 0x57: 'SRE',
    0x58: 'CLI', 0x59: 'EOR', 0x5A: 'NOP', 0x5B: 'SRE', 0x5C: 'IGN', 0x5D: 'EOR', 0x5E: 'LSR', 0x5F: 'SRE',
    0x60: 'RTS', 0x61: 'ADC', 0x62: '---', 0x63: 'RRA', 0x64: 'IGN', 0x65: 'ADC', 0x66: 'ROR', 0x67: 'RRA',
    0x68: 'PLA', 0x69: 'ADC', 0x6A: 'ROR', 0x6B: '---', 0x6C: 'JMP', 0x6D: 'ADC', 0x6E: 'ROR', 0x6F: 'RRA',
    0x70: 'BVS', 0x71: 'ADC', 0x72: '---', 0x73: 'RRA', 0x74: 'IGN', 0x75: 'ADC', 0x76: 'ROR', 0x77: 'RRA',
    0x78: 'SEI', 0x79: 'ADC', 0x7A: 'NOP', 0x7B: 'RRA', 0x7C: 'IGN', 0x7D: 'ADC', 0x7E: 'ROR', 0x7F: 'RRA',
    0x80: 'SKB', 0x81: 'STA', 0x82: 'SKB', 0x83: 'SAX', 0x84: 'STY', 0x85: 'STA', 0x86: 'STX', 0x87: 'SAX',
    0x88: 'DEY', 0x89: 'SKB', 0x8A: 'TXA', 0x8B: '---', 0x8C: 'STY', 0x8D: 'STA', 0x8E: 'STX', 0x8F: 'SAX',
    0x90: 'BCC', 0x91: 'STA', 0x92: '---', 0x93: '---', 0x94: 'STY', 0x95: 'STA', 0x96: 'STX', 0x97: 'SAX',
    0x98: 'TYA', 0x99: 'STA', 0x9A: 'TXS', 0x9B: '---', 0x9C: '---', 0x9D: 'STA', 0x9E: '---', 0x9F: '---',
    0xA0: 'LDY', 0xA1: 'LDA', 0xA2: 'LDX', 0xA3: 'LAX', 0xA4: 'LDY', 0xA5: 'LDA', 0xA6: 'LDX', 0xA7: 'LAX',
    0xA8: 'TAY', 0xA9: 'LDA', 0xAA: 'TAX', 0xAB: '---', 0xAC: 'LDY', 0xAD: 'LDA', 0xAE: 'LDX', 0xAF: 'LAX',
    0xB0: 'BCS', 0xB1: 'LDA', 0xB2: '---', 0xB3: 'LAX', 0xB4: 'LDY', 0xB5: 'LDA', 0xB6: 'LDX', 0xB7: 'LAX',
    0xB8: 'CLV', 0xB9: 'LDA', 0xBA: 'TSX', 0xBB: '---', 0xBC: 'LDY', 0xBD: 'LDA', 0xBE: 'LDX', 0xBF: 'LAX',
    0xC0: 'CPY', 0xC1: 'CMP', 0xC2: 'SKB', 0xC3: 'DCP', 0xC4: 'CPY', 0xC5: 'CMP', 0xC6: 'DEC', 0xC7: 'DCP',
    0xC8: 'INY', 0xC9: 'CMP', 0xCA: 'DEX', 0xCB: '---', 0xCC: 'CPY', 0xCD: 'CMP', 0xCE: 'DEC', 0xCF: 'DCP',
    0xD0: 'BNE', 0xD1: 'CMP', 0xD2: '---', 0xD3: 'DCP', 0xD4: 'IGN', 0xD5: 'CMP', 0xD6: 'DEC', 0xD7: 'DCP',
    0xD8: 'CLD', 0xD9: 'CMP', 0xDA: 'NOP', 0xDB: 'DCP', 0xDC: 'IGN', 0xDD: 'CMP', 0xDE: 'DEC', 0xDF: 'DCP',
    0xE0: 'CPX', 0xE1: 'SBC', 0xE2: 'SKB', 0xE3: 'ISB', 0xE4: 'CPX', 0xE5: 'SBC', 0xE6: 'INC', 0xE7: 'ISB',
    0xE8: 'INX', 0xE9: 'SBC', 0xEA: 'NOP', 0xEB: 'SBC', 0xEC: 'CPX', 0xED: 'SBC', 0xEE: 'INC', 0xEF: 'ISB',
    0xF0: 'BEQ', 0xF1: 'SBC', 0xF2: '---', 0xF3: 'ISB', 0xF4: 'IGN', 0xF5: 'SBC', 0xF6: 'INC', 0xF7: 'ISB',
    0xF8: 'SED', 0xF9: 'SBC', 0xFA: 'NOP', 0xFB: 'ISB', 0xFC: 'IGN', 0xFD: 'SBC', 0xFE: 'INC', 0xFF: 'ISB'
};

enum AddressingModes {
    Immediate,
    Absolute,
    AbsoluteIndirect,
    DirectPage,
    AbsoluteIndexedX,
    AbsoluteIndexedY,
    DirectPageIndexedX,
    DirectPageIndexedY,
    DirectPageIndexedIndirectX,
    DirectPageIndirectIndexedY,
    Implicit,
    Accumulator,
    Relative
};

const OpAddressingMode: any = {
    0x00: AddressingModes.Implicit, 
    0x01: AddressingModes.DirectPageIndexedIndirectX,
    0x02: null,
    0x03: AddressingModes.DirectPageIndexedIndirectX,
    0x04: AddressingModes.DirectPage,
    0x05: AddressingModes.DirectPage,
    0x06: AddressingModes.DirectPage,
    0x07: AddressingModes.DirectPage,
    0x08: AddressingModes.Implicit,
    0x09: AddressingModes.Immediate,
    0x0A: AddressingModes.Accumulator,
    0x0B: null,
    0x0C: AddressingModes.Absolute,
    0x0D: AddressingModes.Absolute,
    0x0E: AddressingModes.Absolute,
    0x0F: AddressingModes.Absolute,
    0x10: AddressingModes.Relative, 
    0x11: AddressingModes.DirectPageIndirectIndexedY,
    0x12: null,
    0x13: AddressingModes.DirectPageIndirectIndexedY,
    0x14: AddressingModes.DirectPageIndexedX,
    0x15: AddressingModes.DirectPageIndexedX,
    0x16: AddressingModes.DirectPageIndexedX,
    0x17: AddressingModes.DirectPageIndexedX,
    0x18: AddressingModes.Implicit,
    0x19: AddressingModes.AbsoluteIndexedY,
    0x1A: AddressingModes.Implicit,
    0x1B: AddressingModes.AbsoluteIndexedY,
    0x1C: AddressingModes.AbsoluteIndexedX,
    0x1D: AddressingModes.AbsoluteIndexedX,
    0x1E: AddressingModes.AbsoluteIndexedX,
    0x1F: AddressingModes.AbsoluteIndexedX,
    0x20: null, 
    0x21: AddressingModes.DirectPageIndexedIndirectX,
    0x22: null,
    0x23: AddressingModes.DirectPageIndexedIndirectX,
    0x24: AddressingModes.DirectPage,
    0x25: AddressingModes.DirectPage,
    0x26: AddressingModes.DirectPage,
    0x27: AddressingModes.DirectPage,
    0x28: AddressingModes.Implicit,
    0x29: AddressingModes.Immediate,
    0x2A: AddressingModes.Accumulator,
    0x2B: null,
    0x2C: AddressingModes.Absolute,
    0x2D: AddressingModes.Absolute,
    0x2E: AddressingModes.Absolute,
    0x2F: AddressingModes.Absolute,
    0x30: AddressingModes.Relative, 
    0x31: AddressingModes.DirectPageIndirectIndexedY,
    0x32: null,
    0x33: AddressingModes.DirectPageIndirectIndexedY,
    0x34: AddressingModes.DirectPageIndexedX,
    0x35: AddressingModes.DirectPageIndexedX,
    0x36: AddressingModes.DirectPageIndexedX,
    0x37: AddressingModes.DirectPageIndexedX,
    0x38: AddressingModes.Implicit,
    0x39: AddressingModes.AbsoluteIndexedY,
    0x3A: AddressingModes.Implicit,
    0x3B: AddressingModes.AbsoluteIndexedY,
    0x3C: AddressingModes.AbsoluteIndexedX,
    0x3D: AddressingModes.AbsoluteIndexedX,
    0x3E: AddressingModes.AbsoluteIndexedX,
    0x3F: AddressingModes.AbsoluteIndexedX,
    0x40: AddressingModes.Implicit, 
    0x41: AddressingModes.DirectPageIndexedIndirectX,
    0x42: null,
    0x43: AddressingModes.DirectPageIndexedIndirectX,
    0x44: AddressingModes.DirectPage,
    0x45: AddressingModes.DirectPage,
    0x46: AddressingModes.DirectPage,
    0x47: AddressingModes.DirectPage,
    0x48: AddressingModes.Implicit,
    0x49: AddressingModes.Immediate,
    0x4A: AddressingModes.Accumulator,
    0x4B: null,
    0x4C: AddressingModes.Absolute,
    0x4D: AddressingModes.Absolute,
    0x4E: AddressingModes.Absolute,
    0x4F: AddressingModes.Absolute,
    0x50: AddressingModes.Relative, 
    0x51: AddressingModes.DirectPageIndirectIndexedY,
    0x52: null,
    0x53: AddressingModes.DirectPageIndirectIndexedY,
    0x54: AddressingModes.DirectPageIndexedX,
    0x55: AddressingModes.DirectPageIndexedX,
    0x56: AddressingModes.DirectPageIndexedX,
    0x57: AddressingModes.DirectPageIndexedX,
    0x58: AddressingModes.Implicit,
    0x59: AddressingModes.AbsoluteIndexedY,
    0x5A: AddressingModes.Implicit,
    0x5B: AddressingModes.AbsoluteIndexedY,
    0x5C: AddressingModes.AbsoluteIndexedX,
    0x5D: AddressingModes.AbsoluteIndexedX,
    0x5E: AddressingModes.AbsoluteIndexedX,
    0x5F: AddressingModes.AbsoluteIndexedX,
    0x60: AddressingModes.Implicit, 
    0x61: AddressingModes.DirectPageIndexedIndirectX,
    0x62: null,
    0x63: AddressingModes.DirectPageIndexedIndirectX,
    0x64: AddressingModes.DirectPage,
    0x65: AddressingModes.DirectPage,
    0x66: AddressingModes.DirectPage,
    0x67: AddressingModes.DirectPage,
    0x68: AddressingModes.Implicit,
    0x69: AddressingModes.Immediate,
    0x6A: AddressingModes.Accumulator,
    0x6B: null,
    0x6C: AddressingModes.AbsoluteIndirect,
    0x6D: AddressingModes.Absolute,
    0x6E: AddressingModes.Absolute,
    0x6F: AddressingModes.Absolute,
    0x70: AddressingModes.Relative, 
    0x71: AddressingModes.DirectPageIndirectIndexedY,
    0x72: null,
    0x73: AddressingModes.DirectPageIndirectIndexedY,
    0x74: AddressingModes.DirectPageIndexedX,
    0x75: AddressingModes.DirectPageIndexedX,
    0x76: AddressingModes.DirectPageIndexedX,
    0x77: AddressingModes.DirectPageIndexedX,
    0x78: AddressingModes.Implicit,
    0x79: AddressingModes.AbsoluteIndexedY,
    0x7A: AddressingModes.Implicit,
    0x7B: AddressingModes.AbsoluteIndexedY,
    0x7C: AddressingModes.AbsoluteIndexedX,
    0x7D: AddressingModes.AbsoluteIndexedX,
    0x7E: AddressingModes.AbsoluteIndexedX,
    0x7F: AddressingModes.AbsoluteIndexedX,
    0x80: AddressingModes.Immediate, 
    0x81: AddressingModes.DirectPageIndexedIndirectX,
    0x82: AddressingModes.Immediate,
    0x83: AddressingModes.DirectPageIndexedIndirectX,
    0x84: AddressingModes.DirectPage,
    0x85: AddressingModes.DirectPage,
    0x86: AddressingModes.DirectPage,
    0x87: AddressingModes.DirectPage,
    0x88: AddressingModes.Implicit,
    0x89: AddressingModes.Immediate,
    0x8A: AddressingModes.Implicit,
    0x8B: null,
    0x8C: AddressingModes.Absolute,
    0x8D: AddressingModes.Absolute,
    0x8E: AddressingModes.Absolute,
    0x8F: AddressingModes.Absolute,
    0x90: AddressingModes.Relative, 
    0x91: AddressingModes.DirectPageIndirectIndexedY,
    0x92: null,
    0x93: null,
    0x94: AddressingModes.DirectPageIndexedX,
    0x95: AddressingModes.DirectPageIndexedX,
    0x96: AddressingModes.DirectPageIndexedY,
    0x97: AddressingModes.DirectPageIndirectIndexedY,
    0x98: AddressingModes.Implicit,
    0x99: AddressingModes.AbsoluteIndexedY,
    0x9A: AddressingModes.Implicit,
    0x9B: null,
    0x9C: null,
    0x9D: AddressingModes.AbsoluteIndexedX,
    0x9E: null,
    0x9F: null,
    0xA0: AddressingModes.Immediate, 
    0xA1: AddressingModes.DirectPageIndexedIndirectX,
    0xA2: AddressingModes.Immediate,
    0xA3: AddressingModes.DirectPageIndexedIndirectX,
    0xA4: AddressingModes.DirectPage,
    0xA5: AddressingModes.DirectPage,
    0xA6: AddressingModes.DirectPage,
    0xA7: AddressingModes.DirectPage,
    0xA8: AddressingModes.Implicit,
    0xA9: AddressingModes.Immediate,
    0xAA: AddressingModes.Implicit,
    0xAB: null,
    0xAC: AddressingModes.Absolute,
    0xAD: AddressingModes.Absolute,
    0xAE: AddressingModes.Absolute,
    0xAF: AddressingModes.Absolute,
    0xB0: AddressingModes.Relative, 
    0xB1: AddressingModes.DirectPageIndirectIndexedY,
    0xB2: null,
    0xB3: AddressingModes.DirectPageIndirectIndexedY,
    0xB4: AddressingModes.DirectPageIndexedX,
    0xB5: AddressingModes.DirectPageIndexedX,
    0xB6: AddressingModes.DirectPageIndexedY,
    0xB7: AddressingModes.DirectPageIndexedY,
    0xB8: AddressingModes.Implicit,
    0xB9: AddressingModes.AbsoluteIndexedY,
    0xBA: AddressingModes.Implicit,
    0xBB: null,
    0xBC: AddressingModes.AbsoluteIndexedX,
    0xBD: AddressingModes.AbsoluteIndexedX,
    0xBE: AddressingModes.AbsoluteIndexedY,
    0xBF: AddressingModes.AbsoluteIndexedY,
    0xC0: AddressingModes.Immediate, 
    0xC1: AddressingModes.DirectPageIndexedIndirectX,
    0xC2: AddressingModes.Immediate,
    0xC3: AddressingModes.DirectPageIndexedIndirectX,
    0xC4: AddressingModes.DirectPage,
    0xC5: AddressingModes.DirectPage,
    0xC6: AddressingModes.DirectPage,
    0xC7: AddressingModes.DirectPage,
    0xC8: AddressingModes.Implicit,
    0xC9: AddressingModes.Immediate,
    0xCA: AddressingModes.Implicit,
    0xCB: null,
    0xCC: AddressingModes.Absolute,
    0xCD: AddressingModes.Absolute,
    0xCE: AddressingModes.Absolute,
    0xCF: AddressingModes.Absolute,
    0xD0: AddressingModes.Relative, 
    0xD1: AddressingModes.DirectPageIndirectIndexedY,
    0xD2: null,
    0xD3: AddressingModes.DirectPageIndirectIndexedY,
    0xD4: AddressingModes.DirectPageIndexedX,
    0xD5: AddressingModes.DirectPageIndexedX,
    0xD6: AddressingModes.DirectPageIndexedX,
    0xD7: AddressingModes.DirectPageIndexedX,
    0xD8: AddressingModes.Implicit,
    0xD9: AddressingModes.AbsoluteIndexedY,
    0xDA: AddressingModes.Implicit,
    0xDB: AddressingModes.AbsoluteIndexedY,
    0xDC: AddressingModes.AbsoluteIndexedX,
    0xDD: AddressingModes.AbsoluteIndexedX,
    0xDE: AddressingModes.AbsoluteIndexedX,
    0xDF: AddressingModes.AbsoluteIndexedX,
    0xE0: AddressingModes.Immediate, 
    0xE1: AddressingModes.DirectPageIndexedIndirectX,
    0xE2: AddressingModes.Immediate,
    0xE3: AddressingModes.DirectPageIndexedIndirectX,
    0xE4: AddressingModes.DirectPage,
    0xE5: AddressingModes.DirectPage,
    0xE6: AddressingModes.DirectPage,
    0xE7: AddressingModes.DirectPage,
    0xE8: AddressingModes.Implicit,
    0xE9: AddressingModes.Immediate,
    0xEA: AddressingModes.Implicit,
    0xEB: AddressingModes.Immediate,
    0xEC: AddressingModes.Absolute,
    0xED: AddressingModes.Absolute,
    0xEE: AddressingModes.Absolute,
    0xEF: AddressingModes.Absolute,
    0xF0: AddressingModes.Relative, 
    0xF1: AddressingModes.DirectPageIndirectIndexedY,
    0xF2: null,
    0xF3: AddressingModes.DirectPageIndirectIndexedY,
    0xF4: AddressingModes.DirectPageIndexedX,
    0xF5: AddressingModes.DirectPageIndexedX,
    0xF6: AddressingModes.DirectPageIndexedX,
    0xF7: AddressingModes.DirectPageIndexedX,
    0xF8: AddressingModes.Implicit,
    0xF9: AddressingModes.AbsoluteIndexedY,
    0xFA: null,
    0xFB: AddressingModes.AbsoluteIndexedY,
    0xFC: AddressingModes.AbsoluteIndexedX,
    0xFD: AddressingModes.AbsoluteIndexedX,
    0xFE: AddressingModes.AbsoluteIndexedX,
    0xFF: AddressingModes.AbsoluteIndexedX
};

export class Cpu {
    private _memory: Memory;
    private _addressingHelper: CpuAddressingHelper;

    private _currentCycles: number;
    private _currentPpuScanlineCycles: number;
    private _currentScanlines: number;

    // A register is 1 byte wide (max: 255)
    private _regA: ByteRegister;

    // X register is 1 byte wide (max: 255)
    private _regX: ByteRegister;

    // Y register is 1 byte wide (max: 255)
    private _regY: ByteRegister;

    // PC register is 2 bytes wide (max: 65535)
    private _regPC: DoubleByteRegister;

    // SP register is 1 byte wide (max 255)
    private _regSP: ByteRegister;

    // P register is 1 byte wide (max 255)
    private _regP: ByteRegister;

    private _log: string[];

    constructor(memory: Memory, log: string[]) {
        this._currentCycles = 0;
        this._currentPpuScanlineCycles = 0;
        this._currentScanlines = 0;

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

    public pushLog(
        opcode: number
    ) {        
        let formattedOpcode = `${opcode.toString(16).toUpperCase()}`;
        if(formattedOpcode.length < 2) {
            formattedOpcode = `0${formattedOpcode}`;
        }

        let output = ``;

        // Format of the log entry:
        // C000  4C F5 C5  JMP $C5F5                       A:00 X:00 Y:00 P:24 SP:FD PPU:  0,  0 CYC:7


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

        output += `${this.getRegisterLog()} ${this.getPpuLog()} ${this.getCpuCycleLog()}`;
        this._log.push(output);
    }

    /*
        Immediate,
    Absolute,
    AbsoluteIndirect,
    DirectPage,
    AbsoluteIndexedX,
    AbsoluteIndexedY,
    DirectPageIndexedX,
    DirectPageIndexedY,
    DirectPageIndexedIndirectX,
    DirectPageIndirectIndexedY,
    Implicit,
    Accumulator,
    Relative
    */

    public getAddressString(addressingMode: AddressingModes) {

        let byteString = ``;
        switch(addressingMode) {
            case AddressingModes.Immediate:
                let data = this._memory.get(this._regPC.get() + 1).toString(16).toUpperCase();
                if(data.length < 2) {
                    data = '0' + data;
                }
                byteString = `#$${data}`;
                break;
            case AddressingModes.DirectPage:
                byteString = `${this._memory.get(this._regPC.get() + 1).toString(16).toUpperCase()}`;
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
                byteString  = `$${(this._memory.get(this._regPC.get() + 2)).toString(16).toUpperCase()}${this._memory.get(this._regPC.get() + 1).toString(16).toUpperCase()}`;
                break;
            case AddressingModes.Relative:
                let displacement = this._memory.get(this._regPC.get() + 1);
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
                let val = this._memory.get(this._regPC.get() + 1);
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
                let highVal = this._memory.get(this._regPC.get() + 2);
                let lowVal = this._memory.get(this._regPC.get() + 1);

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

    public getPpuLog() {
        const scanlineCycles = this._currentPpuScanlineCycles;
        const scanlineCyclesString = scanlineCycles.toString();

        let formattedScanlineCyclesString = scanlineCyclesString;
        for(let i = 0; i < (3 - scanlineCyclesString.length); i++) {
            formattedScanlineCyclesString = ' ' + formattedScanlineCyclesString;
        }

        const scanlines = this._currentScanlines;
        const scanlinesString = scanlines.toString();

        let formattedScanlinesString = scanlinesString;
        for(let i = 0; i < (3 - scanlinesString.length); i++) {
            formattedScanlinesString = ' ' + formattedScanlinesString;
        }

        return `PPU:${formattedScanlineCyclesString},${formattedScanlinesString}`;
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
        this._regP.set(0x24);
        this._regA.set(0);
        this._regX.set(0);
        this._regY.set(0);
        this._regSP.set(0x01FD);

        this._memory.set(0x4015, 0);
        this._memory.set(0x4017, 0);

        for(let i = 0x4000; i <= 0x400F; i++) {
            this._memory.set(i, 0x0);
        }

        for(let i = 0x0000; i <= 0x07FF; i++) {
            this._memory.set(i, 0xFF);
        }

        this._regPC.set(0xC000);
        this._currentCycles = 7;
    }

    public stackPush(data: number): void {
        const address = 0x100 | (this._regSP.get());
        this._memory.set(address, data);
        this._regSP.set(address - 1);
    }

    public stackPull(): number {
        const address = 0x100 | (this._regSP.get() + 1);
        this._regSP.set(address);
        return this._memory.get(address);
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
                operand = this._memory.get(address);
                
                this._regA.set(oldA + operand + carry);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0x6D: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 4;
                this._regPC.add(2);
                break;
            case 0x65: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 3;
                this._regPC.add(1);
                break;
            case 0x7D: // Absolute Indexed, X
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += (4 + pageBoundaryCycle);
                this._regPC.add(2);
                break;
            case 0x79: // Absolute Indexed, Y
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += (4 + pageBoundaryCycle);
                this._regPC.add(2);
                break;
            case 0x75: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 4;
                this._regPC.add(1);
                break;
            case 0x61: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles += 6;
                this._regPC.add(1);
                break;
            case 0x71: // Direct Page Indirect Indexed, Y
                if(this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                
                this._regA.set(oldA + operand + carry);
                this._currentCycles+= (5 + pageBoundaryCycle);
                this._regPC.add(1);
                break;
            default:
                console.error(`ERROR: Unhandled ADC opcode!`);
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
                operand = this._memory.get(this._regPC.get());
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 2;
                this._regPC.add(1);
                break;
            case 0x2D:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 4;
                this._regPC.add(2);
                break;
            case 0x25:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 3;
                this._regPC.add(1);
                break;
            case 0x3D:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memory.get(address);
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += (4 + pageBoundaryCycle);
                this._regPC.add(2);
                break;
            case 0x39:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memory.get(address);
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += (4 + pageBoundaryCycle);
                this._regPC.add(2);
                break;
            case 0x35:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 4;
                this._regPC.add(1);
                break;
            case 0x21:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += 6;
                this._regPC.add(1);
                break;
            case 0x31:
                pageBoundaryCycle = this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY) ? 1 : 0;
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                
                this._regA.set(this._regA.get() & operand);
                this._currentCycles += (5 + pageBoundaryCycle);
                this._regPC.add(1);
                break;
            default:
                console.error(`ERROR: Unhandled AND opcode! ${opCode}`);
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
                oldVal = this._memory.get(address);
                
                result = oldVal << 1;
                this._memory.set(address, result);
                this._currentCycles += 6;
                this._regPC.add(2);
                break;
            case 0x06:
                address = this._addressingHelper.atDirectPage(this._regPC);
                oldVal = this._memory.get(address);
                
                result = oldVal << 1;
                this._memory.set(address, result);
                this._currentCycles += 5;
                this._regPC.add(1);
                break;
            case 0x1E:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                oldVal = this._memory.get(address);
                
                result = oldVal << 1;
                this._memory.set(address, result);
                this._currentCycles += 7;
                this._regPC.add(2);
                break;
            case 0x16:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                oldVal = this._memory.get(address);
                
                result = oldVal << 1;
                this._memory.set(address, result);
                this._currentCycles += 6;
                this._regPC.add(1);
                break;
            default:
                console.error(`ERROR: Invalid ASL opcode! ${opCode}`);
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
                let displacement = this._memory.get(this._regPC.get()) & 0xFF;
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
            default:
                console.error(`ERROR: Unhandled BCC opcode! ${opCode}`);
                break;
        }
    }

    public bcs(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0xB0:
                let displacement = this._memory.get(this._regPC.get()) & 0xFF;
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
            default:
                console.error(`ERROR: Unhandled BCS opcode! ${opCode}`);
                break;
        }
    }

    public beq(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0xF0:
                let displacement = this._memory.get(this._regPC.get()) & 0xFF;
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
            default: 
                console.error(`ERROR: Unhandled BEQ opcode! ${opCode}`);
        }
    }

    public bit(opCode: number) {
        let address = 0;
        let operand = 0;

        this._regPC.add(1);
        switch(opCode) {
            case 0x2C: // Absolute Addressing
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);

                

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
                operand = this._memory.get(address);

                

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
            default:
                console.error(`ERROR: Unhandled BIT opcode! ${opCode}`);
                break;
        }
    }

    public bmi(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0x30:
                let displacement = this._memory.get(this._regPC.get()) & 0xFF;
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
            default:
                console.error(`ERROR: Unhandled BMI opcode! ${opCode}`);
                break;
        }
    }

    public bne(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0xD0:
                let displacement = this._memory.get(this._regPC.get()) & 0xFF;
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
            default:
                console.error(`ERROR: Unhandled BNE opcode! ${opCode}`);
                break;
        }
    }

    public bpl(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0x10: 
                let displacement = this._memory.get(this._regPC.get()) & 0xFF;
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
            default:
                console.error(`ERROR: Unhandled BPL opcode! ${opCode}`);
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
                
                let interruptVectorLow = this._memory.get(0xFFFE);
                let interruptVectorHigh = this._memory.get(0xFFFF);

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
                let displacement = this._memory.get(this._regPC.get()) & 0xFF;
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
            default:
                console.error(`ERROR: Unhandled BVC opcode! ${opCode}`);
                break;
        }
    }

    public bvs(opCode: number) {
        this._regPC.add(1);
        switch(opCode) {
            case 0x70:
                let displacement = this._memory.get(this._regPC.get()) & 0xFF;
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
            default:
                console.error(`ERROR: Unhandled BVS opcode! ${opCode}`);
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
            default:
                console.error(`ERROR: Unhandled CLC opcode! ${opCode}`);
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
            default:
                console.error(`ERROR: Unhandled CLD opcode! ${opCode}`);
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
            default:
                console.error(`ERROR: Unhandled CLI opcode! ${opCode}`);
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
            default:
                console.error(`ERROR: Unhandled CLV opcode! ${opCode}`);
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
                operand = this._memory.get(this._regPC.get());
                
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
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
                if(this._regA.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._currentCycles += (5 + pageBoundaryCycle);
                this._regPC.add(1);
                break;
            default:
                console.error(`ERROR: Unhandled CMP opcode! ${opCode}`);
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
                operand = this._memory.get(this._regPC.get());
                
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
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
                if(this._regX.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            default:
                console.error(`ERROR: Unhandled CPX opcode! ${opCode}`);
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
                operand = this._memory.get(this._regPC.get());
                
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
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
                if(this._regY.get() >= operand) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            default:
                console.error(`ERROR: Unhandled CPY opcode! ${opCode}`);
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
                operand = this._memory.get(address);
                operand--;

                this._memory.set(address, operand);

                if(this._regA.get() >= this._memory.get(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 8;    
                break;
            case 0xC7:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                operand--;

                this._memory.set(address, operand);

                if(this._regA.get() >= this._memory.get(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 5;    
                break;            
            case 0xCF:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                operand--;

                this._memory.set(address, operand);

                if(this._regA.get() >= this._memory.get(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += 6;    
                break;
            case 0xD3:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                operand--;

                this._memory.set(address, operand);

                if(this._regA.get() >= this._memory.get(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += (8);    
                break;
            case 0xD7:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                operand--;

                this._memory.set(address, operand);

                if(this._regA.get() >= this._memory.get(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(1);
                this._currentCycles += 6;    
                break;
            case 0xDB:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                operand--;

                this._memory.set(address, operand);

                if(this._regA.get() >= this._memory.get(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += (7);    
                break;
            case 0xDF:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                operand--;

                this._memory.set(address, operand);

                if(this._regA.get() >= this._memory.get(address)) {
                    carry = 1;
                } else {
                    carry = 0;
                }
                this._regPC.add(2);
                this._currentCycles += (7);    
                break;
        }

        if(this.isNegative(this._regA.get() - this._memory.get(address))) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._regA.get() - this._memory.get(address))) {
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
                operand = this._memory.get(address);
                
                this._memory.set(address, operand - 1);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0xC6: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
                this._memory.set(address, operand - 1);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0xDE: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._memory.set(address, operand - 1);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0xD6: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._memory.set(address, operand - 1);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            default:
                console.error(`ERROR: Unhandled DEC opcode! ${opCode}`);
                break;
        }

        if(this.isNegative(this._memory.get(address))) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._memory.get(address))) {
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
            default:
                console.error(`ERROR: Unhandled DEX opcode! ${opCode}`);
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
            default:
                console.error(`ERROR: Unhandled DEY opcode! ${opCode}`);
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
                operand = this._memory.get(this._regPC.get());
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0x4D: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x45: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0x55: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0x41: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
                result = this._regA.get() ^ operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += (5 + pageBoundaryCycle);
                break;
            default:
                console.error(`ERROR: Unhandled EOR opcode! ${opCode}`);
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
                operand = this._memory.get(address);
                
                this._memory.set(address, operand + 1);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0xE6: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
                this._memory.set(address, operand + 1);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0xFE: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._memory.set(address, operand + 1);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0xF6: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._memory.set(address, operand + 1);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            default:
                console.error(`ERROR: Unhandled INC opcode! ${opCode}`);
                break;
        }

        if(this.isNegative(this._memory.get(address))) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isZero(this._memory.get(address))) {
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
            default:
                console.error(`ERROR: Unhandled INX opcode! ${opCode}`);
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
            default:
                console.error(`ERROR: Unhandled INY opcode! ${opCode}`);
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
        let pageBoundaryCycle = 0;
        let result = 0;
        let oldA = this._regA.get();
        // Subtract 1 more if carry is clear!
        let currentCarry = !this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;

        this._regPC.add(1);

        // INC then SBC
        switch(opcode) {
            case 0xE3:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memory.get(address);
                operand++;
                this._memory.set(address, operand);

                result = oldA - this._memory.get(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0xE7:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                operand++;
                this._memory.set(address, operand);

                result = oldA - this._memory.get(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(1);
                this._currentCycles += 5;          
                break;  
            case 0xEF:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                operand++;
                this._memory.set(address, operand);

                result = oldA - this._memory.get(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(2);
                this._currentCycles += 6;          
                break;  
            case 0xF3:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                operand++;
                this._memory.set(address, operand);

                result = oldA - this._memory.get(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(1);
                this._currentCycles += 8;          
                break;             
            case 0xF7:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                operand++;
                this._memory.set(address, operand);

                result = oldA - this._memory.get(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(1);
                this._currentCycles += 6;          
                break;         
            case 0xFB:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                operand++;
                this._memory.set(address, operand);

                result = oldA - this._memory.get(address) - currentCarry;
                this._regA.set(result);

                this._regPC.add(2);
                this._currentCycles += 7;          
                break;               
            case 0xFF:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                operand++;
                this._memory.set(address, operand);

                result = oldA - this._memory.get(address) - currentCarry;
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

        if(this.isOverflow(oldA, this._memory.get(address), this._regA.get(), false)) {
            this.setStatusBit(StatusBitPositions.Overflow);
        } else {
            this.clearStatusBit(StatusBitPositions.Overflow);
        }

        if(this.isZero(result)) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(this.isCarry(oldA, this._memory.get(address), currentCarry, false)) {
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
                
                //this._regPC.add(2);
                this._regPC.set(address);
                this._currentCycles += 3;
                break;
            case 0x6C:
                address = this._addressingHelper.atAbsoluteIndirect(this._regPC);
                
                if((this._regPC.get() & 0x00FF) === 0x00FF) {
                    this._currentCycles += 1;
                }
                this._regPC.set(address);
                //this._regPC.add(2);
                this._currentCycles += 5;
                break;
            default:
                console.error(`ERROR: Unhandled JMP opcode! ${opCode}`);
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
            default:
                console.error(`ERROR: Unhandled JSR opcode! ${opCode}`);
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
                operand = this._memory.get(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0xA7:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xAF:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
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
                operand = this._memory.get(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0xB7:
                address = this._addressingHelper.atDirectPageIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
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
                operand = this._memory.get(address);
                this._regA.set(operand);
                this._regX.set(this._regA.get());
                this._regPC.add(2);
                this._currentCycles += 4;
                break;            
            default:
                console.error(`ERROR: Unhandled LAX opcode! ${opcode}`);
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
                operand = this._memory.get(this._regPC.get());
                
                this._currentCycles += 2;
                this._regA.set(operand);
                this._regPC.add(1);
                break;
            case 0xAD: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                
                this._regA.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xA5: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xBD: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memory.get(address);
                
                this._regA.set(operand);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0xB9: // Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memory.get(address);
                
                this._regA.set(operand);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0xB5: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0xA1: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0xB1: // Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtDirectPageIndirectIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memory.get(address);
                
                this._regA.set(operand);
                this._regPC.add(1);
                this._currentCycles += (5 + pageBoundaryCycle);
                break;
            default:
                console.error(`ERROR: Unhandled LDA opcode! ${opCode}`);
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
                operand = this._memory.get(this._regPC.get());
                
                this._regX.set(operand);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xAE: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                
                this._regX.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xA6: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
                this._regX.set(operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xBE: // Absolute Indexed, Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedY(this._regPC, this._regY)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memory.get(address);
                
                this._regX.set(operand);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0xB6: // Direct Page Indexed, Y
                address = this._addressingHelper.atDirectPageIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                
                this._regX.set(operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            default:
                console.error(`ERROR: Unhandled LDX opcode! ${opCode}`);
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
                operand = this._memory.get(this._regPC.get());
                
                this._regY.set(operand);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xAC: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                
                this._regY.set(operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xA4: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
                this._regY.set(operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0xBC: // Absolute Indexed X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                if(this._addressingHelper.crossesPageBoundaryAtAbsoluteIndexedX(this._regPC, this._regX)) {
                    pageBoundaryCycle = 1;
                }
                operand = this._memory.get(address);
                
                this._regY.set(operand);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0xB4: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                this._regY.set(operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            default:
                console.error(`ERROR: Unhandled LDY opcode! ${opcode}`);
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
                operand = this._memory.get(address);
                
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memory.set(address, result);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x46: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memory.set(address, result);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x5E: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memory.set(address, result);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x56: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                carry = (operand & 0x0001) === 1 ? 1 : 0;
                result = operand >> 1;
                this._memory.set(address, result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;            
            default:
                console.error(`ERROR: Unhandled LSR opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled NOP opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled SKB opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled IGN opcode! ${opcode}`);
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
                operand = this._memory.get(this._regPC.get());
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0x0D: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x05: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0x15: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0x01: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
                result = this._regA.get() | operand;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += (5 + pageBoundaryCycle);
                break;
            default:
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
            default:
                console.error(`ERROR: Unhandled PHA opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled PHP opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled PLA opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled PLP opcode! ${opcode}`);
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

                operand = this._memory.get(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memory.set(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memory.get(address));

                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x27:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memory.set(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memory.get(address));
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x2F:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memory.set(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memory.get(address));
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x33:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memory.set(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memory.get(address));
                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x37:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memory.set(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memory.get(address));
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x3B:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memory.set(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memory.get(address));
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x3F:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;

                this._memory.set(address, ((operand << 1) | oldCarry));

                this._regA.set(this._regA.get() & this._memory.get(address));
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
                operand = this._memory.get(address);
                
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;
                result = ((operand << 1) | oldCarry);
                this._memory.set(address, result);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x26: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;
                result = ((operand << 1) | oldCarry);
                this._memory.set(address, result);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x3E: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;
                result = ((operand << 1) | oldCarry);
                this._memory.set(address, result);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x36: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                newCarry = ((operand & 0x80) > 0) ? 1 : 0;
                result = ((operand << 1) | oldCarry);
                this._memory.set(address, result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            default:
                console.error(`ERROR: Unhandled ROL opcode! ${opcode}`);
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
                operand = this._memory.get(address);
                
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;
                result = ((operand >> 1) | (oldCarry << 7));
                this._memory.set(address, result);
                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x66: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;
                result = ((operand >> 1) | (oldCarry << 7));
                this._memory.set(address, result);
                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x7E: // Absolute Indexed, X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;
                result = ((operand >> 1) | (oldCarry << 7));
                this._memory.set(address, result);
                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x76: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;
                result = ((operand >> 1) | (oldCarry << 7));
                this._memory.set(address, result);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            default:
                console.error(`ERROR: Unhandled ROR opcode! ${opcode}`);
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
                operand = this._memory.get(address);

                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;

                operand = ((operand >> 1) | (oldCarry << 7));
                this._memory.set(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                // adc time
                oldA = this._regA.get();

                this._regA.set(this._regA.get() + this._memory.get(address) + newCarry);

                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x67:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memory.set(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                // adc time
                oldA = this._regA.get();

                this._regA.set(this._regA.get() + this._memory.get(address) + newCarry);

                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x6F:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memory.set(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                // adc time
                oldA = this._regA.get();

                this._regA.set(this._regA.get() + this._memory.get(address) + newCarry);

                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x73:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memory.set(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                // adc time
                oldA = this._regA.get();

                this._regA.set(this._regA.get() + this._memory.get(address) + newCarry);

                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x77:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memory.set(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                // adc time
                oldA = this._regA.get();

                this._regA.set(this._regA.get() + this._memory.get(address) + newCarry);

                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x7B:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memory.set(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                // adc time
                oldA = this._regA.get();

                this._regA.set(this._regA.get() + this._memory.get(address) + newCarry);

                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x7F:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                newCarry = ((operand & 0x0001) > 0) ? 1 : 0;


                operand = ((operand >> 1) | (oldCarry << 7));
                this._memory.set(address, operand);

                if(newCarry === 1) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                // adc time
                oldA = this._regA.get();

                this._regA.set(this._regA.get() + this._memory.get(address) + newCarry);

                this._regPC.add(2);
                this._currentCycles += 7;
                break;
        }

        if(this.isNegative(this._regA.get())) {
            this.setStatusBit(StatusBitPositions.Negative);
        } else {
            this.clearStatusBit(StatusBitPositions.Negative);
        }

        if(this.isOverflow(oldA, this._memory.get(address), this._regA.get(), true)) {
            this.setStatusBit(StatusBitPositions.Overflow);
        } else {
            this.clearStatusBit(StatusBitPositions.Overflow);
        }

        if(this._regA.get() === 0) {
            this.setStatusBit(StatusBitPositions.Zero);
        } else {
            this.clearStatusBit(StatusBitPositions.Zero);
        }

        if(this.isCarry(oldA, this._memory.get(address), newCarry, true)) {
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
            default:
                console.error(`ERROR: Unhandled RTI opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled RTS opcode! ${opcode}`);
                break;
        }
    }

    public sax(opcode: number) {
        let address = 0;

        this._regPC.add(1);
        switch(opcode) {
            case 0x83:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                this._memory.set(address, this._regA.get() & this._regX.get());
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x87:
                address = this._addressingHelper.atDirectPage(this._regPC);
                this._memory.set(address, this._regA.get() & this._regX.get());
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x8F:
                address = this._addressingHelper.atAbsolute(this._regPC);
                this._memory.set(address, this._regA.get() & this._regX.get());
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x97:
                address = this._addressingHelper.atDirectPageIndexedY(this._regPC, this._regY);
                this._memory.set(address, this._regA.get() & this._regX.get());
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            default:
                console.error()
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
                operand = this._memory.get(this._regPC.get());
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 2;
                break;
            case 0xED: // Absolute
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0xE5: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
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
                operand = this._memory.get(address);
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(2);
                this._currentCycles += (4 + pageBoundaryCycle);
                break;
            case 0xF5: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0xE1: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memory.get(address);
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
                operand = this._memory.get(address);
                
                result = oldA - operand - currentCarry;
                this._regA.set(result);
                this._regPC.add(1);
                this._currentCycles += (5 + pageBoundaryCycle);
                break;
            default:
                console.error(`ERROR: Unhandled SBC opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled SEC opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled SED opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled SEI opcode! ${opcode}`);
                break;
        }
    }

    public slo(opcode: number) {
        let address = 0;
        let operand = 0;

        this._regPC.add(1);

        //ASL value then ORA value
        switch(opcode) {
            case 0x03:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memory.get(address);

                if((this._memory.get(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                operand <<= 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() | this._memory.get(address));

                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x07:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);

                if((this._memory.get(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                operand <<= 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() | this._memory.get(address));

                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x0F:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);

                if((this._memory.get(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                operand <<= 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() | this._memory.get(address));

                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x13:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);

                if((this._memory.get(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                operand <<= 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() | this._memory.get(address));

                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x17:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);

                if((this._memory.get(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                operand <<= 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() | this._memory.get(address));

                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x1B:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);

                if((this._memory.get(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                operand <<= 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() | this._memory.get(address));

                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x1F:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);

                if((this._memory.get(address) & 0x80) === 0x80) {
                    this.setStatusBit(StatusBitPositions.Carry);
                } else {
                    this.clearStatusBit(StatusBitPositions.Carry);
                }

                operand <<= 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() | this._memory.get(address));

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

        // LSR then EOR
        this._regPC.add(1);

        switch(opcode) {
            case 0x43:
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._memory.get(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;

                operand = operand >> 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() ^ this._memory.get(address));

                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x47:
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._memory.get(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;

                operand = operand >> 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() ^ this._memory.get(address));

                this._regPC.add(1);
                this._currentCycles += 5;
                break;
            case 0x4F:
                address = this._addressingHelper.atAbsolute(this._regPC);
                operand = this._memory.get(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;

                operand = operand >> 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() ^ this._memory.get(address));

                this._regPC.add(2);
                this._currentCycles += 6;
                break;
            case 0x53:
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;

                operand = operand >> 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() ^ this._memory.get(address));

                this._regPC.add(1);
                this._currentCycles += 8;
                break;
            case 0x57:
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;

                operand = operand >> 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() ^ this._memory.get(address));

                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x5B:
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._memory.get(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;

                operand = operand >> 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() ^ this._memory.get(address));

                this._regPC.add(2);
                this._currentCycles += 7;
                break;
            case 0x5F:
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._memory.get(address);
                carry = (operand & 0x0001) === 1 ? 1 : 0;

                operand = operand >> 1;
                this._memory.set(address, operand);

                this._regA.set(this._regA.get() ^ this._memory.get(address));

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
                
                this._memory.set(address, operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x85: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._regA.get();
                
                this._memory.set(address, operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x9D: // Absolute Indexed X
                address = this._addressingHelper.atAbsoluteIndexedX(this._regPC, this._regX);
                operand = this._regA.get();
                
                this._memory.set(address, operand);
                this._regPC.add(2);
                this._currentCycles += 5;
                break;
            case 0x99: // Absolute Indexed Y
                address = this._addressingHelper.atAbsoluteIndexedY(this._regPC, this._regY);
                operand = this._regA.get();
                
                this._memory.set(address, operand);
                this._regPC.add(2);
                this._currentCycles += 5;
                break;
            case 0x95: // Direct Page Indexed X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._regA.get();
                
                this._memory.set(address, operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            case 0x81: // Direct Page Indexed Indirect, X
                address = this._addressingHelper.atDirectPageIndexedIndirectX(this._regPC, this._regX);
                operand = this._regA.get();
                
                this._memory.set(address, operand);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            case 0x91: // Direct Page Indirect Indexed, Y
                address = this._addressingHelper.atDirectPageIndirectIndexedY(this._regPC, this._regY);
                operand = this._regA.get();
                
                this._memory.set(address, operand);
                this._regPC.add(1);
                this._currentCycles += 6;
                break;
            default:
                console.error(`ERROR: Unhandled STA opcode! ${opcode}`);
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
                
                this._memory.set(address, operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x86: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._regX.get();
                
                this._memory.set(address, operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x96: // Direct Page Indexed, Y
                address = this._addressingHelper.atDirectPageIndexedY(this._regPC, this._regY);
                operand = this._regX.get();
                
                this._memory.set(address, operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            default:
                console.error(`ERROR: Unhandled STX opcode! ${opcode}`);
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
                
                this._memory.set(address, operand);
                this._regPC.add(2);
                this._currentCycles += 4;
                break;
            case 0x84: // Direct Page
                address = this._addressingHelper.atDirectPage(this._regPC);
                operand = this._regY.get();
                
                this._memory.set(address, operand);
                this._regPC.add(1);
                this._currentCycles += 3;
                break;
            case 0x94: // Direct Page Indexed, X
                address = this._addressingHelper.atDirectPageIndexedX(this._regPC, this._regX);
                operand = this._regY.get();
                
                this._memory.set(address, operand);
                this._regPC.add(1);
                this._currentCycles += 4;
                break;
            default:
                console.error(`ERROR: Unhandled STY opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled TAX opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled TAY opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled TSX opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled TXA opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled TXS opcode! ${opcode}`);
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
            default:
                console.error(`ERROR: Unhandled TYA opcode! ${opcode}`);
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
        let prevCycles = this._currentCycles;

        this.pushLog(opCode);
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

        let newCycles = this._currentCycles;

        let cyclesAdded = newCycles - prevCycles;

        this._currentPpuScanlineCycles += (cyclesAdded * 3);

        if(this._currentPpuScanlineCycles > 341) {
            this._currentScanlines++;
            
            let remaining = this._currentPpuScanlineCycles - 341;
            this._currentPpuScanlineCycles = remaining;
        }
    }
}

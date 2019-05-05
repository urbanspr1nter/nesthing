"use strict";
exports.__esModule = true;
var StatusBitPositions;
(function (StatusBitPositions) {
    StatusBitPositions[StatusBitPositions["Carry"] = 0] = "Carry";
    StatusBitPositions[StatusBitPositions["Zero"] = 1] = "Zero";
    StatusBitPositions[StatusBitPositions["InterruptDisable"] = 2] = "InterruptDisable";
    StatusBitPositions[StatusBitPositions["DecimalMode"] = 3] = "DecimalMode";
    StatusBitPositions[StatusBitPositions["BrkCausedInterrupt"] = 4] = "BrkCausedInterrupt";
    StatusBitPositions[StatusBitPositions["Bit5"] = 5] = "Bit5";
    StatusBitPositions[StatusBitPositions["Overflow"] = 6] = "Overflow";
    StatusBitPositions[StatusBitPositions["Negative"] = 7] = "Negative";
})(StatusBitPositions = exports.StatusBitPositions || (exports.StatusBitPositions = {}));
;
exports.ResetVectorLocation = {
    Low: 0xFFFC,
    High: 0xFFFD
};
exports.IrqVectorLocation = {
    Low: 0xFFFE,
    High: 0xFFFF
};
exports.NmiVectorLocation = {
    Low: 0xFFFA,
    High: 0xFFFB
};
var InterruptRequestType;
(function (InterruptRequestType) {
    InterruptRequestType[InterruptRequestType["Reset"] = 0] = "Reset";
    InterruptRequestType[InterruptRequestType["NMI"] = 1] = "NMI";
    InterruptRequestType[InterruptRequestType["IRQ"] = 2] = "IRQ";
    InterruptRequestType[InterruptRequestType["None"] = 3] = "None";
})(InterruptRequestType = exports.InterruptRequestType || (exports.InterruptRequestType = {}));
;
var AddressingModes;
(function (AddressingModes) {
    AddressingModes[AddressingModes["Immediate"] = 0] = "Immediate";
    AddressingModes[AddressingModes["Absolute"] = 1] = "Absolute";
    AddressingModes[AddressingModes["AbsoluteIndirect"] = 2] = "AbsoluteIndirect";
    AddressingModes[AddressingModes["DirectPage"] = 3] = "DirectPage";
    AddressingModes[AddressingModes["AbsoluteIndexedX"] = 4] = "AbsoluteIndexedX";
    AddressingModes[AddressingModes["AbsoluteIndexedY"] = 5] = "AbsoluteIndexedY";
    AddressingModes[AddressingModes["DirectPageIndexedX"] = 6] = "DirectPageIndexedX";
    AddressingModes[AddressingModes["DirectPageIndexedY"] = 7] = "DirectPageIndexedY";
    AddressingModes[AddressingModes["DirectPageIndexedIndirectX"] = 8] = "DirectPageIndexedIndirectX";
    AddressingModes[AddressingModes["DirectPageIndirectIndexedY"] = 9] = "DirectPageIndirectIndexedY";
    AddressingModes[AddressingModes["Implicit"] = 10] = "Implicit";
    AddressingModes[AddressingModes["Accumulator"] = 11] = "Accumulator";
    AddressingModes[AddressingModes["Relative"] = 12] = "Relative";
})(AddressingModes = exports.AddressingModes || (exports.AddressingModes = {}));
;
exports.OpLabel = {
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
exports.OpAddressingMode = {
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

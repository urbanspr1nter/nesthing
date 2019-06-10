export enum StatusBitPositions {
  Carry = 0,
  Zero = 1,
  InterruptDisable = 2,
  DecimalMode = 3,
  BrkCausedInterrupt = 4,
  Bit5 = 5,
  Overflow = 6,
  Negative = 7
}

export const ResetVectorLocation = {
  Low: 0xfffc,
  High: 0xfffd
};

export const IrqVectorLocation = {
  Low: 0xfffe,
  High: 0xffff
};

export const NmiVectorLocation = {
  Low: 0xfffa,
  High: 0xfffb
};

export enum InterruptRequestType {
  Reset,
  NMI,
  IRQ,
  None
}

export enum AddressingModes {
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
}

export const OpLabel: string[] = [	
  "BRK", "ORA", "KIL", "SLO", "NOP", "ORA", "ASL", "SLO",
  "PHP", "ORA", "ASL", "ANC", "NOP", "ORA", "ASL", "SLO",
  "BPL", "ORA", "KIL", "SLO", "NOP", "ORA", "ASL", "SLO",
  "CLC", "ORA", "NOP", "SLO", "NOP", "ORA", "ASL", "SLO",
  "JSR", "AND", "KIL", "RLA", "BIT", "AND", "ROL", "RLA",
  "PLP", "AND", "ROL", "ANC", "BIT", "AND", "ROL", "RLA",
  "BMI", "AND", "KIL", "RLA", "NOP", "AND", "ROL", "RLA",
  "SEC", "AND", "NOP", "RLA", "NOP", "AND", "ROL", "RLA",
  "RTI", "EOR", "KIL", "SRE", "NOP", "EOR", "LSR", "SRE",
  "PHA", "EOR", "LSR", "ALR", "JMP", "EOR", "LSR", "SRE",
  "BVC", "EOR", "KIL", "SRE", "NOP", "EOR", "LSR", "SRE",
  "CLI", "EOR", "NOP", "SRE", "NOP", "EOR", "LSR", "SRE",
  "RTS", "ADC", "KIL", "RRA", "NOP", "ADC", "ROR", "RRA",
  "PLA", "ADC", "ROR", "ARR", "JMP", "ADC", "ROR", "RRA",
  "BVS", "ADC", "KIL", "RRA", "NOP", "ADC", "ROR", "RRA",
  "SEI", "ADC", "NOP", "RRA", "NOP", "ADC", "ROR", "RRA",
  "NOP", "STA", "NOP", "SAX", "STY", "STA", "STX", "SAX",
  "DEY", "NOP", "TXA", "XAA", "STY", "STA", "STX", "SAX",
  "BCC", "STA", "KIL", "AHX", "STY", "STA", "STX", "SAX",
  "TYA", "STA", "TXS", "TAS", "SHY", "STA", "SHX", "AHX",
  "LDY", "LDA", "LDX", "LAX", "LDY", "LDA", "LDX", "LAX",
  "TAY", "LDA", "TAX", "LAX", "LDY", "LDA", "LDX", "LAX",
  "BCS", "LDA", "KIL", "LAX", "LDY", "LDA", "LDX", "LAX",
  "CLV", "LDA", "TSX", "LAS", "LDY", "LDA", "LDX", "LAX",
  "CPY", "CMP", "NOP", "DCP", "CPY", "CMP", "DEC", "DCP",
  "INY", "CMP", "DEX", "AXS", "CPY", "CMP", "DEC", "DCP",
  "BNE", "CMP", "KIL", "DCP", "NOP", "CMP", "DEC", "DCP",
  "CLD", "CMP", "NOP", "DCP", "NOP", "CMP", "DEC", "DCP",
  "CPX", "SBC", "NOP", "ISC", "CPX", "SBC", "INC", "ISC",
  "INX", "SBC", "NOP", "SBC", "CPX", "SBC", "INC", "ISC",
  "BEQ", "SBC", "KIL", "ISC", "NOP", "SBC", "INC", "ISC",
  "SED", "SBC", "NOP", "ISC", "NOP", "SBC", "INC", "ISC"
];

export const OpAddressingMode = {
  0x00: AddressingModes.Implicit,
  0x01: AddressingModes.DirectPageIndexedIndirectX,
  0x02: null,
  0x03: null,
  0x04: null,
  0x05: AddressingModes.DirectPage,
  0x06: AddressingModes.DirectPage,
  0x07: null,
  0x08: AddressingModes.Implicit,
  0x09: AddressingModes.Immediate,
  0x0a: AddressingModes.Accumulator,
  0x0b: null,
  0x0c: null,
  0x0d: AddressingModes.Absolute,
  0x0e: AddressingModes.Absolute,
  0x0f: null,
  0x10: AddressingModes.Relative,
  0x11: AddressingModes.DirectPageIndirectIndexedY,
  0x12: null,
  0x13: AddressingModes.DirectPageIndirectIndexedY,
  0x14: null,
  0x15: AddressingModes.DirectPageIndexedX,
  0x16: AddressingModes.DirectPageIndexedX,
  0x17: null,
  0x18: AddressingModes.Implicit,
  0x19: AddressingModes.AbsoluteIndexedY,
  0x1a: null,
  0x1b: null,
  0x1c: null,
  0x1d: AddressingModes.AbsoluteIndexedX,
  0x1e: AddressingModes.AbsoluteIndexedX,
  0x1f: null,
  0x20: AddressingModes.Absolute,
  0x21: AddressingModes.DirectPageIndexedIndirectX,
  0x22: null,
  0x23: null,
  0x24: AddressingModes.DirectPage,
  0x25: AddressingModes.DirectPage,
  0x26: AddressingModes.DirectPage,
  0x27: null,
  0x28: AddressingModes.Implicit,
  0x29: AddressingModes.Immediate,
  0x2a: AddressingModes.Accumulator,
  0x2b: null,
  0x2c: AddressingModes.Absolute,
  0x2d: AddressingModes.Absolute,
  0x2e: AddressingModes.Absolute,
  0x2f: null,
  0x30: AddressingModes.Relative,
  0x31: AddressingModes.DirectPageIndirectIndexedY,
  0x32: null,
  0x33: null,
  0x34: null,
  0x35: AddressingModes.DirectPageIndexedX,
  0x36: AddressingModes.DirectPageIndexedX,
  0x37: null,
  0x38: AddressingModes.Implicit,
  0x39: AddressingModes.AbsoluteIndexedY,
  0x3a: null,
  0x3b: null,
  0x3c: null,
  0x3d: AddressingModes.AbsoluteIndexedX,
  0x3e: AddressingModes.AbsoluteIndexedX,
  0x3f: null,
  0x40: AddressingModes.Implicit,
  0x41: AddressingModes.DirectPageIndexedIndirectX,
  0x42: null,
  0x43: null,
  0x44: null,
  0x45: AddressingModes.DirectPage,
  0x46: AddressingModes.DirectPage,
  0x47: null,
  0x48: AddressingModes.Implicit,
  0x49: AddressingModes.Immediate,
  0x4a: AddressingModes.Accumulator,
  0x4b: null,
  0x4c: AddressingModes.Absolute,
  0x4d: AddressingModes.Absolute,
  0x4e: AddressingModes.Absolute,
  0x4f: null,
  0x50: AddressingModes.Relative,
  0x51: AddressingModes.DirectPageIndirectIndexedY,
  0x52: null,
  0x53: null,
  0x54: null,
  0x55: AddressingModes.DirectPageIndexedX,
  0x56: AddressingModes.DirectPageIndexedX,
  0x57: null,
  0x58: AddressingModes.Implicit,
  0x59: AddressingModes.AbsoluteIndexedY,
  0x5a: null,
  0x5b: null,
  0x5c: null,
  0x5d: AddressingModes.AbsoluteIndexedX,
  0x5e: AddressingModes.AbsoluteIndexedX,
  0x5f: null,
  0x60: AddressingModes.Implicit,
  0x61: AddressingModes.DirectPageIndexedIndirectX,
  0x62: null,
  0x63: null,
  0x64: null,
  0x65: AddressingModes.DirectPage,
  0x66: AddressingModes.DirectPage,
  0x67: null,
  0x68: AddressingModes.Implicit,
  0x69: AddressingModes.Immediate,
  0x6a: AddressingModes.Accumulator,
  0x6b: null,
  0x6c: AddressingModes.AbsoluteIndirect,
  0x6d: AddressingModes.Absolute,
  0x6e: AddressingModes.Absolute,
  0x6f: null,
  0x70: AddressingModes.Relative,
  0x71: AddressingModes.DirectPageIndirectIndexedY,
  0x72: null,
  0x73: null,
  0x74: null,
  0x75: AddressingModes.DirectPageIndexedX,
  0x76: AddressingModes.DirectPageIndexedX,
  0x77: null,
  0x78: AddressingModes.Implicit,
  0x79: AddressingModes.AbsoluteIndexedY,
  0x7a: null,
  0x7b: null,
  0x7c: null,
  0x7d: AddressingModes.AbsoluteIndexedX,
  0x7e: AddressingModes.AbsoluteIndexedX,
  0x7f: null,
  0x80: null,
  0x81: AddressingModes.DirectPageIndexedIndirectX,
  0x82: null,
  0x83: null,
  0x84: AddressingModes.DirectPage,
  0x85: AddressingModes.DirectPage,
  0x86: AddressingModes.DirectPage,
  0x87: null,
  0x88: AddressingModes.Implicit,
  0x89: null,
  0x8a: AddressingModes.Implicit,
  0x8b: null,
  0x8c: AddressingModes.Absolute,
  0x8d: AddressingModes.Absolute,
  0x8e: AddressingModes.Absolute,
  0x8f: null,
  0x90: AddressingModes.Relative,
  0x91: AddressingModes.DirectPageIndirectIndexedY,
  0x92: null,
  0x93: null,
  0x94: AddressingModes.DirectPageIndexedX,
  0x95: AddressingModes.DirectPageIndexedX,
  0x96: AddressingModes.DirectPageIndexedY,
  0x97: null,
  0x98: AddressingModes.Implicit,
  0x99: AddressingModes.AbsoluteIndexedY,
  0x9a: AddressingModes.Implicit,
  0x9b: null,
  0x9c: null,
  0x9d: AddressingModes.AbsoluteIndexedX,
  0x9e: null,
  0x9f: null,
  0xa0: AddressingModes.Immediate,
  0xa1: AddressingModes.DirectPageIndexedIndirectX,
  0xa2: AddressingModes.Immediate,
  0xa3: null,
  0xa4: AddressingModes.DirectPage,
  0xa5: AddressingModes.DirectPage,
  0xa6: AddressingModes.DirectPage,
  0xa7: null,
  0xa8: AddressingModes.Implicit,
  0xa9: AddressingModes.Immediate,
  0xaa: AddressingModes.Implicit,
  0xab: null,
  0xac: AddressingModes.Absolute,
  0xad: AddressingModes.Absolute,
  0xae: AddressingModes.Absolute,
  0xaf: null,
  0xb0: AddressingModes.Relative,
  0xb1: AddressingModes.DirectPageIndirectIndexedY,
  0xb2: null,
  0xb3: null,
  0xb4: AddressingModes.DirectPageIndexedX,
  0xb5: AddressingModes.DirectPageIndexedX,
  0xb6: AddressingModes.DirectPageIndexedY,
  0xb7: null,
  0xb8: AddressingModes.Implicit,
  0xb9: AddressingModes.AbsoluteIndexedY,
  0xba: AddressingModes.Implicit,
  0xbb: null,
  0xbc: AddressingModes.AbsoluteIndexedX,
  0xbd: AddressingModes.AbsoluteIndexedX,
  0xbe: AddressingModes.AbsoluteIndexedY,
  0xbf: null,
  0xc0: AddressingModes.Immediate,
  0xc1: AddressingModes.DirectPageIndexedIndirectX,
  0xc2: null,
  0xc3: null,
  0xc4: AddressingModes.DirectPage,
  0xc5: AddressingModes.DirectPage,
  0xc6: AddressingModes.DirectPage,
  0xc7: null,
  0xc8: AddressingModes.Implicit,
  0xc9: AddressingModes.Immediate,
  0xca: AddressingModes.Implicit,
  0xcb: null,
  0xcc: AddressingModes.Absolute,
  0xcd: AddressingModes.Absolute,
  0xce: AddressingModes.Absolute,
  0xcf: null,
  0xd0: AddressingModes.Relative,
  0xd1: AddressingModes.DirectPageIndirectIndexedY,
  0xd2: null,
  0xd3: null,
  0xd4: null,
  0xd5: AddressingModes.DirectPageIndexedX,
  0xd6: AddressingModes.DirectPageIndexedX,
  0xd7: null,
  0xd8: AddressingModes.Implicit,
  0xd9: AddressingModes.AbsoluteIndexedY,
  0xda: null,
  0xdb: null,
  0xdc: null,
  0xdd: AddressingModes.AbsoluteIndexedX,
  0xde: AddressingModes.AbsoluteIndexedX,
  0xdf: null,
  0xe0: AddressingModes.Immediate,
  0xe1: AddressingModes.DirectPageIndexedIndirectX,
  0xe2: null,
  0xe3: null,
  0xe4: AddressingModes.DirectPage,
  0xe5: AddressingModes.DirectPage,
  0xe6: AddressingModes.DirectPage,
  0xe7: null,
  0xe8: AddressingModes.Implicit,
  0xe9: AddressingModes.Immediate,
  0xea: AddressingModes.Implicit,
  0xeb: null,
  0xec: AddressingModes.Absolute,
  0xed: AddressingModes.Absolute,
  0xee: AddressingModes.Absolute,
  0xef: null,
  0xf0: AddressingModes.Relative,
  0xf1: AddressingModes.DirectPageIndirectIndexedY,
  0xf2: null,
  0xf3: null,
  0xf4: null,
  0xf5: AddressingModes.DirectPageIndexedX,
  0xf6: AddressingModes.DirectPageIndexedX,
  0xf7: null,
  0xf8: AddressingModes.Implicit,
  0xf9: AddressingModes.AbsoluteIndexedY,
  0xfa: null,
  0xfb: null,
  0xfc: null,
  0xfd: AddressingModes.AbsoluteIndexedX,
  0xfe: AddressingModes.AbsoluteIndexedX,
  0xff: null
};

export const InstructionSizes = [
	2, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // 0F
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0, // 1F
	3, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // 2F
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0, // 3F
	1, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // 4F
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0, // 5F
	1, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // 6F
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0, // 7F
	2, 2, 0, 0, 2, 2, 2, 0, 1, 0, 1, 0, 3, 3, 3, 0, // 8F
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 0, 3, 0, 0, // 9F
	2, 2, 2, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // AF
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0, // BF
	2, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // CF
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0, // DF 
	2, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0, // EF
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0  // FF
];

export const Cycles = [
	7, 6, 2, 8, 3, 3, 5, 5, 3, 2, 2, 2, 4, 4, 6, 6, // 0F
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, // 1F
	6, 6, 2, 8, 3, 3, 5, 5, 4, 2, 2, 2, 4, 4, 6, 6, // 2F
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, // 3F
	6, 6, 2, 8, 3, 3, 5, 5, 3, 2, 2, 2, 3, 4, 6, 6, // 4F
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, // 5F
  6, 6, 2, 8, 3, 3, 5, 5, 4, 2, 2, 2, 5, 4, 6, 6, // 6F
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, // 7F
	2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4, // 8F
	2, 6, 2, 6, 4, 4, 4, 4, 2, 5, 2, 5, 5, 5, 5, 5, // 9F
	2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4, // AF
	2, 5, 2, 5, 4, 4, 4, 4, 2, 4, 2, 4, 4, 4, 4, 4, // BF
	2, 6, 2, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6, // CF
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7, // DF
	2, 6, 2, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6, // EF
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7  // FF
];

export const PageCycles = [
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0F
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, // 1F
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 2F
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, // 3F
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 4F
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, // 5F
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 6F
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, // 7F
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 8F
	1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 9F
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // AF
	1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, // BF
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // CF
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, // DF
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // EF
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0  // FF
];

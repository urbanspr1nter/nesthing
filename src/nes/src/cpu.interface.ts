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

export const OpLabel: any = {
  0x00: "BRK",
  0x01: "ORA",
  0x02: "---",
  0x03: "---",
  0x04: "---",
  0x05: "ORA",
  0x06: "---",
  0x07: "---",
  0x08: "PHP",
  0x09: "ORA",
  0x0a: "ASL",
  0x0b: "---",
  0x0c: "IGN",
  0x0d: "ORA",
  0x0e: "ASL",
  0x0f: "---",
  0x10: "BPL",
  0x11: "ORA",
  0x12: "---",
  0x13: "SLO",
  0x14: "IGN",
  0x15: "ORA",
  0x16: "ASL",
  0x17: "SLO",
  0x18: "CLC",
  0x19: "ORA",
  0x1a: "NOP",
  0x1b: "SLO",
  0x1c: "IGN",
  0x1d: "ORA",
  0x1e: "ASL",
  0x1f: "SLO",
  0x20: "JSR",
  0x21: "AND",
  0x22: "---",
  0x23: "RLA",
  0x24: "BIT",
  0x25: "AND",
  0x26: "ROL",
  0x27: "RLA",
  0x28: "PLP",
  0x29: "AND",
  0x2a: "ROL",
  0x2b: "---",
  0x2c: "BIT",
  0x2d: "AND",
  0x2e: "ROL",
  0x2f: "RLA",
  0x30: "BMI",
  0x31: "AND",
  0x32: "---",
  0x33: "RLA",
  0x34: "IGN",
  0x35: "AND",
  0x36: "ROL",
  0x37: "---",
  0x38: "SEC",
  0x39: "AND",
  0x3a: "NOP",
  0x3b: "RLA",
  0x3c: "IGN",
  0x3d: "AND",
  0x3e: "ROL",
  0x3f: "RLA",
  0x40: "RTI",
  0x41: "EOR",
  0x42: "---",
  0x43: "SRE",
  0x44: "IGN",
  0x45: "EOR",
  0x46: "LSR",
  0x47: "SRE",
  0x48: "PHA",
  0x49: "EOR",
  0x4a: "LSR",
  0x4b: "---",
  0x4c: "JMP",
  0x4d: "EOR",
  0x4e: "LSR",
  0x4f: "SRE",
  0x50: "BVC",
  0x51: "EOR",
  0x52: "---",
  0x53: "SRE",
  0x54: "IGN",
  0x55: "EOR",
  0x56: "LSR",
  0x57: "SRE",
  0x58: "CLI",
  0x59: "EOR",
  0x5a: "NOP",
  0x5b: "SRE",
  0x5c: "IGN",
  0x5d: "EOR",
  0x5e: "LSR",
  0x5f: "SRE",
  0x60: "RTS",
  0x61: "ADC",
  0x62: "---",
  0x63: "RRA",
  0x64: "IGN",
  0x65: "ADC",
  0x66: "ROR",
  0x67: "RRA",
  0x68: "PLA",
  0x69: "ADC",
  0x6a: "ROR",
  0x6b: "---",
  0x6c: "JMP",
  0x6d: "ADC",
  0x6e: "ROR",
  0x6f: "RRA",
  0x70: "BVS",
  0x71: "ADC",
  0x72: "---",
  0x73: "RRA",
  0x74: "IGN",
  0x75: "ADC",
  0x76: "ROR",
  0x77: "RRA",
  0x78: "SEI",
  0x79: "ADC",
  0x7a: "NOP",
  0x7b: "RRA",
  0x7c: "IGN",
  0x7d: "ADC",
  0x7e: "ROR",
  0x7f: "RRA",
  0x80: "SKB",
  0x81: "STA",
  0x82: "SKB",
  0x83: "SAX",
  0x84: "STY",
  0x85: "STA",
  0x86: "STX",
  0x87: "SAX",
  0x88: "DEY",
  0x89: "SKB",
  0x8a: "TXA",
  0x8b: "---",
  0x8c: "STY",
  0x8d: "STA",
  0x8e: "STX",
  0x8f: "SAX",
  0x90: "BCC",
  0x91: "STA",
  0x92: "---",
  0x93: "---",
  0x94: "STY",
  0x95: "STA",
  0x96: "STX",
  0x97: "SAX",
  0x98: "TYA",
  0x99: "STA",
  0x9a: "TXS",
  0x9b: "---",
  0x9c: "---",
  0x9d: "STA",
  0x9e: "---",
  0x9f: "---",
  0xa0: "LDY",
  0xa1: "LDA",
  0xa2: "LDX",
  0xa3: "LAX",
  0xa4: "LDY",
  0xa5: "LDA",
  0xa6: "LDX",
  0xa7: "LAX",
  0xa8: "TAY",
  0xa9: "LDA",
  0xaa: "TAX",
  0xab: "---",
  0xac: "LDY",
  0xad: "LDA",
  0xae: "LDX",
  0xaf: "LAX",
  0xb0: "BCS",
  0xb1: "LDA",
  0xb2: "---",
  0xb3: "LAX",
  0xb4: "LDY",
  0xb5: "LDA",
  0xb6: "LDX",
  0xb7: "LAX",
  0xb8: "CLV",
  0xb9: "LDA",
  0xba: "TSX",
  0xbb: "---",
  0xbc: "LDY",
  0xbd: "LDA",
  0xbe: "LDX",
  0xbf: "LAX",
  0xc0: "CPY",
  0xc1: "CMP",
  0xc2: "SKB",
  0xc3: "DCP",
  0xc4: "CPY",
  0xc5: "CMP",
  0xc6: "DEC",
  0xc7: "DCP",
  0xc8: "INY",
  0xc9: "CMP",
  0xca: "DEX",
  0xcb: "---",
  0xcc: "CPY",
  0xcd: "CMP",
  0xce: "DEC",
  0xcf: "DCP",
  0xd0: "BNE",
  0xd1: "CMP",
  0xd2: "---",
  0xd3: "DCP",
  0xd4: "IGN",
  0xd5: "CMP",
  0xd6: "DEC",
  0xd7: "DCP",
  0xd8: "CLD",
  0xd9: "CMP",
  0xda: "NOP",
  0xdb: "DCP",
  0xdc: "IGN",
  0xdd: "CMP",
  0xde: "DEC",
  0xdf: "DCP",
  0xe0: "CPX",
  0xe1: "SBC",
  0xe2: "SKB",
  0xe3: "ISB",
  0xe4: "CPX",
  0xe5: "SBC",
  0xe6: "INC",
  0xe7: "ISB",
  0xe8: "INX",
  0xe9: "SBC",
  0xea: "NOP",
  0xeb: "SBC",
  0xec: "CPX",
  0xed: "SBC",
  0xee: "INC",
  0xef: "ISB",
  0xf0: "BEQ",
  0xf1: "SBC",
  0xf2: "---",
  0xf3: "ISB",
  0xf4: "IGN",
  0xf5: "SBC",
  0xf6: "INC",
  0xf7: "ISB",
  0xf8: "SED",
  0xf9: "SBC",
  0xfa: "NOP",
  0xfb: "ISB",
  0xfc: "IGN",
  0xfd: "SBC",
  0xfe: "INC",
  0xff: "ISB"
};

export const OpAddressingMode: { [id: string]: AddressingModes } = {
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
  0x0a: AddressingModes.Accumulator,
  0x0b: null,
  0x0c: AddressingModes.Absolute,
  0x0d: AddressingModes.Absolute,
  0x0e: AddressingModes.Absolute,
  0x0f: AddressingModes.Absolute,
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
  0x1a: AddressingModes.Implicit,
  0x1b: AddressingModes.AbsoluteIndexedY,
  0x1c: AddressingModes.AbsoluteIndexedX,
  0x1d: AddressingModes.AbsoluteIndexedX,
  0x1e: AddressingModes.AbsoluteIndexedX,
  0x1f: AddressingModes.AbsoluteIndexedX,
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
  0x2a: AddressingModes.Accumulator,
  0x2b: null,
  0x2c: AddressingModes.Absolute,
  0x2d: AddressingModes.Absolute,
  0x2e: AddressingModes.Absolute,
  0x2f: AddressingModes.Absolute,
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
  0x3a: AddressingModes.Implicit,
  0x3b: AddressingModes.AbsoluteIndexedY,
  0x3c: AddressingModes.AbsoluteIndexedX,
  0x3d: AddressingModes.AbsoluteIndexedX,
  0x3e: AddressingModes.AbsoluteIndexedX,
  0x3f: AddressingModes.AbsoluteIndexedX,
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
  0x4a: AddressingModes.Accumulator,
  0x4b: null,
  0x4c: AddressingModes.Absolute,
  0x4d: AddressingModes.Absolute,
  0x4e: AddressingModes.Absolute,
  0x4f: AddressingModes.Absolute,
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
  0x5a: AddressingModes.Implicit,
  0x5b: AddressingModes.AbsoluteIndexedY,
  0x5c: AddressingModes.AbsoluteIndexedX,
  0x5d: AddressingModes.AbsoluteIndexedX,
  0x5e: AddressingModes.AbsoluteIndexedX,
  0x5f: AddressingModes.AbsoluteIndexedX,
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
  0x6a: AddressingModes.Accumulator,
  0x6b: null,
  0x6c: AddressingModes.AbsoluteIndirect,
  0x6d: AddressingModes.Absolute,
  0x6e: AddressingModes.Absolute,
  0x6f: AddressingModes.Absolute,
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
  0x7a: AddressingModes.Implicit,
  0x7b: AddressingModes.AbsoluteIndexedY,
  0x7c: AddressingModes.AbsoluteIndexedX,
  0x7d: AddressingModes.AbsoluteIndexedX,
  0x7e: AddressingModes.AbsoluteIndexedX,
  0x7f: AddressingModes.AbsoluteIndexedX,
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
  0x8a: AddressingModes.Implicit,
  0x8b: null,
  0x8c: AddressingModes.Absolute,
  0x8d: AddressingModes.Absolute,
  0x8e: AddressingModes.Absolute,
  0x8f: AddressingModes.Absolute,
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
  0x9a: AddressingModes.Implicit,
  0x9b: null,
  0x9c: null,
  0x9d: AddressingModes.AbsoluteIndexedX,
  0x9e: null,
  0x9f: null,
  0xa0: AddressingModes.Immediate,
  0xa1: AddressingModes.DirectPageIndexedIndirectX,
  0xa2: AddressingModes.Immediate,
  0xa3: AddressingModes.DirectPageIndexedIndirectX,
  0xa4: AddressingModes.DirectPage,
  0xa5: AddressingModes.DirectPage,
  0xa6: AddressingModes.DirectPage,
  0xa7: AddressingModes.DirectPage,
  0xa8: AddressingModes.Implicit,
  0xa9: AddressingModes.Immediate,
  0xaa: AddressingModes.Implicit,
  0xab: null,
  0xac: AddressingModes.Absolute,
  0xad: AddressingModes.Absolute,
  0xae: AddressingModes.Absolute,
  0xaf: AddressingModes.Absolute,
  0xb0: AddressingModes.Relative,
  0xb1: AddressingModes.DirectPageIndirectIndexedY,
  0xb2: null,
  0xb3: AddressingModes.DirectPageIndirectIndexedY,
  0xb4: AddressingModes.DirectPageIndexedX,
  0xb5: AddressingModes.DirectPageIndexedX,
  0xb6: AddressingModes.DirectPageIndexedY,
  0xb7: AddressingModes.DirectPageIndexedY,
  0xb8: AddressingModes.Implicit,
  0xb9: AddressingModes.AbsoluteIndexedY,
  0xba: AddressingModes.Implicit,
  0xbb: null,
  0xbc: AddressingModes.AbsoluteIndexedX,
  0xbd: AddressingModes.AbsoluteIndexedX,
  0xbe: AddressingModes.AbsoluteIndexedY,
  0xbf: AddressingModes.AbsoluteIndexedY,
  0xc0: AddressingModes.Immediate,
  0xc1: AddressingModes.DirectPageIndexedIndirectX,
  0xc2: AddressingModes.Immediate,
  0xc3: AddressingModes.DirectPageIndexedIndirectX,
  0xc4: AddressingModes.DirectPage,
  0xc5: AddressingModes.DirectPage,
  0xc6: AddressingModes.DirectPage,
  0xc7: AddressingModes.DirectPage,
  0xc8: AddressingModes.Implicit,
  0xc9: AddressingModes.Immediate,
  0xca: AddressingModes.Implicit,
  0xcb: null,
  0xcc: AddressingModes.Absolute,
  0xcd: AddressingModes.Absolute,
  0xce: AddressingModes.Absolute,
  0xcf: AddressingModes.Absolute,
  0xd0: AddressingModes.Relative,
  0xd1: AddressingModes.DirectPageIndirectIndexedY,
  0xd2: null,
  0xd3: AddressingModes.DirectPageIndirectIndexedY,
  0xd4: AddressingModes.DirectPageIndexedX,
  0xd5: AddressingModes.DirectPageIndexedX,
  0xd6: AddressingModes.DirectPageIndexedX,
  0xd7: AddressingModes.DirectPageIndexedX,
  0xd8: AddressingModes.Implicit,
  0xd9: AddressingModes.AbsoluteIndexedY,
  0xda: AddressingModes.Implicit,
  0xdb: AddressingModes.AbsoluteIndexedY,
  0xdc: AddressingModes.AbsoluteIndexedX,
  0xdd: AddressingModes.AbsoluteIndexedX,
  0xde: AddressingModes.AbsoluteIndexedX,
  0xdf: AddressingModes.AbsoluteIndexedX,
  0xe0: AddressingModes.Immediate,
  0xe1: AddressingModes.DirectPageIndexedIndirectX,
  0xe2: AddressingModes.Immediate,
  0xe3: AddressingModes.DirectPageIndexedIndirectX,
  0xe4: AddressingModes.DirectPage,
  0xe5: AddressingModes.DirectPage,
  0xe6: AddressingModes.DirectPage,
  0xe7: AddressingModes.DirectPage,
  0xe8: AddressingModes.Implicit,
  0xe9: AddressingModes.Immediate,
  0xea: AddressingModes.Implicit,
  0xeb: AddressingModes.Immediate,
  0xec: AddressingModes.Absolute,
  0xed: AddressingModes.Absolute,
  0xee: AddressingModes.Absolute,
  0xef: AddressingModes.Absolute,
  0xf0: AddressingModes.Relative,
  0xf1: AddressingModes.DirectPageIndirectIndexedY,
  0xf2: null,
  0xf3: AddressingModes.DirectPageIndirectIndexedY,
  0xf4: AddressingModes.DirectPageIndexedX,
  0xf5: AddressingModes.DirectPageIndexedX,
  0xf6: AddressingModes.DirectPageIndexedX,
  0xf7: AddressingModes.DirectPageIndexedX,
  0xf8: AddressingModes.Implicit,
  0xf9: AddressingModes.AbsoluteIndexedY,
  0xfa: null,
  0xfb: AddressingModes.AbsoluteIndexedY,
  0xfc: AddressingModes.AbsoluteIndexedX,
  0xfd: AddressingModes.AbsoluteIndexedX,
  0xfe: AddressingModes.AbsoluteIndexedX,
  0xff: AddressingModes.AbsoluteIndexedX
};

export const InstructionSizes = [
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  2,
  1,
  0,
  3,
  3,
  3,
  0,
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  3,
  1,
  0,
  3,
  3,
  3,
  0,
  3,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  2,
  1,
  0,
  3,
  3,
  3,
  0,
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  3,
  1,
  0,
  3,
  3,
  3,
  0,
  1,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  2,
  1,
  0,
  3,
  3,
  3,
  0,
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  3,
  1,
  0,
  3,
  3,
  3,
  0,
  1,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  2,
  1,
  0,
  3,
  3,
  3,
  0,
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  3,
  1,
  0,
  3,
  3,
  3,
  0,
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  0,
  1,
  0,
  3,
  3,
  3,
  0,
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  3,
  1,
  0,
  0,
  3,
  0,
  0,
  2,
  2,
  2,
  0,
  2,
  2,
  2,
  0,
  1,
  2,
  1,
  0,
  3,
  3,
  3,
  0,
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  3,
  1,
  0,
  3,
  3,
  3,
  0,
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  2,
  1,
  0,
  3,
  3,
  3,
  0,
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  3,
  1,
  0,
  3,
  3,
  3,
  0,
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  2,
  1,
  0,
  3,
  3,
  3,
  0,
  2,
  2,
  0,
  0,
  2,
  2,
  2,
  0,
  1,
  3,
  1,
  0,
  3,
  3,
  3,
  0
];

export const Cycles = [
  7,
  6,
  2,
  8,
  3,
  3,
  5,
  5,
  3,
  2,
  2,
  2,
  4,
  4,
  6,
  6,
  2,
  5,
  2,
  8,
  4,
  4,
  6,
  6,
  2,
  4,
  2,
  7,
  4,
  4,
  7,
  7,
  6,
  6,
  2,
  8,
  3,
  3,
  5,
  5,
  4,
  2,
  2,
  2,
  4,
  4,
  6,
  6,
  2,
  5,
  2,
  8,
  4,
  4,
  6,
  6,
  2,
  4,
  2,
  7,
  4,
  4,
  7,
  7,
  6,
  6,
  2,
  8,
  3,
  3,
  5,
  5,
  3,
  2,
  2,
  2,
  3,
  4,
  6,
  6,
  2,
  5,
  2,
  8,
  4,
  4,
  6,
  6,
  2,
  4,
  2,
  7,
  4,
  4,
  7,
  7,
  6,
  6,
  2,
  8,
  3,
  3,
  5,
  5,
  4,
  2,
  2,
  2,
  5,
  4,
  6,
  6,
  2,
  5,
  2,
  8,
  4,
  4,
  6,
  6,
  2,
  4,
  2,
  7,
  4,
  4,
  7,
  7,
  2,
  6,
  2,
  6,
  3,
  3,
  3,
  3,
  2,
  2,
  2,
  2,
  4,
  4,
  4,
  4,
  2,
  6,
  2,
  6,
  4,
  4,
  4,
  4,
  2,
  5,
  2,
  5,
  5,
  5,
  5,
  5,
  2,
  6,
  2,
  6,
  3,
  3,
  3,
  3,
  2,
  2,
  2,
  2,
  4,
  4,
  4,
  4,
  2,
  5,
  2,
  5,
  4,
  4,
  4,
  4,
  2,
  4,
  2,
  4,
  4,
  4,
  4,
  4,
  2,
  6,
  2,
  8,
  3,
  3,
  5,
  5,
  2,
  2,
  2,
  2,
  4,
  4,
  6,
  6,
  2,
  5,
  2,
  8,
  4,
  4,
  6,
  6,
  2,
  4,
  2,
  7,
  4,
  4,
  7,
  7,
  2,
  6,
  2,
  8,
  3,
  3,
  5,
  5,
  2,
  2,
  2,
  2,
  4,
  4,
  6,
  6,
  2,
  5,
  2,
  8,
  4,
  4,
  6,
  6,
  2,
  4,
  2,
  7,
  4,
  4,
  7,
  7
];

import { Cartridge } from "./cartridge/cartridge";
import { MirrorMode } from "./cpu/constants";
import { Cpu } from "./cpu/cpu";
import { Ppu } from "./ppu/ppu";
import { InterruptRequestType } from "./cpu/cpu.interface";

export interface IMapper {
  save(): any;
  load(state: any): void;
  read(address: number): number;
  write(address: number, value: number): void;
  step(): void;
  cartridge: Cartridge;
}

export class NromMapper implements IMapper {
  private _cartridge: Cartridge;
  private _prgBanks: number;
  private _prgBank1: number;
  private _prgBank2: number;

  constructor(cartridge: Cartridge) {
    this._cartridge = cartridge;
    this._prgBanks = (this._cartridge.prg.length / 0x4000) | 0;
    this._prgBank1 = 0;
    this._prgBank2 = this._prgBanks - 1;
  }

  get cartridge() {
    return this._cartridge;
  }

  public save() {
    return {
      prgBanks: this._prgBanks,
      prgBank1: this._prgBank1,
      prgBank2: this._prgBank2
    };
  }

  public load(state: any) {
    this._prgBanks = state.prgBanks;
    this._prgBank1 = state.prgBank1;
    this._prgBank2 = state.prgBank2;
  }

  public read(address: number) {
    if (address < 0x2000) {
      return this._cartridge.chr[address];
    } else if (address >= 0xc000) {
      var index = this._prgBank2 * 0x4000 + (address - 0xc000);
      return this._cartridge.prg[index];
    } else if (address >= 0x8000) {
      var index = this._prgBank1 * 0x4000 + (address - 0x8000);
      return this._cartridge.prg[index];
    } else if (address >= 0x6000) {
      var index = address - 0x6000;
      return this._cartridge.sram[index];
    }

    return 0;
  }

  public write(address: number, value: number) {
    if (address < 0x2000) {
      this._cartridge.chr[address] = value;
    } else if (address >= 0x8000) {
      this._prgBank1 = value % this._prgBanks;
    } else if (address >= 0x6000) {
      var index = address - 0x6000;
      this._cartridge.sram[index] = value;
    }
  }

  public step() {
    return;
  }
}

export class Mmc1Mapper implements IMapper {
  private _cartridge: Cartridge;
  private _shiftRegister: number;
  private _control: number;
  private _prgMode: number;
  private _chrMode: number;
  private _prgBank: number;
  private _chrBank0: number;
  private _chrBank1: number;
  private _prgOffsets: number[];
  private _chrOffsets: number[];

  constructor(cartridge: Cartridge) {
    this._control = 0;
    this._prgMode = 0;
    this._chrMode = 0;
    this._prgBank = 0;
    this._chrBank0 = 0;
    this._chrBank1 = 0;

    this._cartridge = cartridge;
    this._shiftRegister = 0x10;

    this._prgOffsets = [];
    for (let i = 0; i < 2; i++) {
      this._prgOffsets[i] = 0;
    }
    this._prgOffsets[1] = this._prgBankOffset(-1);

    this._chrOffsets = [];
    for (let i = 0; i < 2; i++) {
      this._chrOffsets[i] = 0;
    }
  }

  get cartridge() {
    return this._cartridge;
  }

  public save() {
    return {
      shiftRegister: this._shiftRegister,
      control: this._control,
      prgMode: this._prgMode,
      chrMode: this._chrMode,
      prgBank: this._prgBank,
      chrBank0: this._chrBank0,
      chrBank1: this._chrBank1,
      prgOffsets: this._prgOffsets,
      chrOffsets: this._chrOffsets
    };
  }

  public load(state: any) {
    this._shiftRegister = state.shiftRegister;
    this._control = state.control;
    this._prgMode = state.prgMode;
    this._chrMode = state.chrMode;
    this._prgBank = state.prgBank;
    this._chrBank0 = state.chrBank0;
    this._chrBank1 = state.chrBank1;
    this._prgOffsets = state.prgOffsets;
    this._chrOffsets = state.chrOffsets;
  }

  public read(address: number): number {
    var bank = 0;
    var offset = 0;
    if (address < 0x2000) {
      bank = Math.trunc(address / 0x1000);
      offset = address % 0x1000;
      return this._cartridge.chr[this._chrOffsets[bank] + offset];
    } else if (address >= 0x8000) {
      address = address - 0x8000;
      bank = Math.trunc(address / 0x4000);
      offset = address % 0x4000;
      return this._cartridge.prg[this._prgOffsets[bank] + offset];
    } else if (address >= 0x6000) {
      return this._cartridge.sram[address - 0x6000];
    }
    return 0;
  }

  public write(address: number, value: number): void {
    var bank = 0;
    var offset = 0;
    if (address < 0x2000) {
      bank = Math.trunc(address / 0x1000);
      offset = address % 0x1000;
      this._cartridge.chr[this._chrOffsets[bank] + offset] = value & 0xff;
    } else if (address >= 0x8000) {
      this._loadRegister(address, value);
    } else if (address >= 0x6000) {
      this._cartridge.sram[address - 0x6000] = value;
    }
  }

  public step(): void {
    return;
  }

  private _loadRegister(address: number, value: number) {
    if ((value & 0x80) === 0x80) {
      this._shiftRegister = 0x10;
      this._writeControl(this._control | 0x0c);
    } else {
      var complete = (this._shiftRegister & 1) === 1;
      this._shiftRegister >>>= 1;
      this._shiftRegister |= (value & 1) << 4;
      if (complete) {
        this._writeRegister(address, this._shiftRegister);
        this._shiftRegister = 0x10;
      }
    }
  }

  private _writeRegister(address: number, value: number) {
    if (address <= 0x9fff) {
      this._writeControl(value);
    } else if (address <= 0xbfff) {
      this._writeCHRBank0(value);
    } else if (address <= 0xdfff) {
      this._writeCHRBank1(value);
    } else if (address <= 0xffff) {
      this._writePRGBank(value);
    }
  }

  private _writeControl(value: number) {
    this._control = value;
    this._chrMode = (value >>> 4) & 1;
    this._prgMode = (value >>> 2) & 3;

    var mirror = value & 3;

    if (mirror === 0) {
      this._cartridge.mirror = MirrorMode.MirrorSingle0;
    } else if (mirror === 1) {
      this._cartridge.mirror = MirrorMode.MirrorSingle1;
    } else if (mirror === 2) {
      this._cartridge.mirror = MirrorMode.MirrorVertical;
    } else if (mirror === 3) {
      this._cartridge.mirror = MirrorMode.MirrorHorizontal;
    }

    this._updateOffsets();
  }

  private _writeCHRBank0(value: number) {
    this._chrBank0 = value;
    this._updateOffsets();
  }

  private _writeCHRBank1(value: number) {
    this._chrBank1 = value;
    this._updateOffsets();
  }

  private _writePRGBank(value: number) {
    this._prgBank = value & 0xf;
    this._updateOffsets();
  }

  private _prgBankOffset(index: number) {
    var idx = index;
    if (idx >= 0x80) {
      idx -= 0x100;
    }

    idx = idx % Math.trunc(this._cartridge.prg.length / 0x4000);

    var offset = idx * 0x4000;
    if (offset < 0) {
      offset += this._cartridge.prg.length;
    }

    return offset;
  }

  private _chrBankOffset(index: number) {
    var idx = index;

    if (idx >= 0x80) {
      idx -= 0x100;
    }

    idx = idx % Math.trunc(this._cartridge.chr.length / 0x1000);

    var offset = idx * 0x1000;
    if (offset < 0) {
      offset += this._cartridge.chr.length;
    }

    return offset;
  }

  private _updateOffsets() {
    if (this._prgMode === 0 || this._prgMode === 1) {
      this._prgOffsets[0] = this._prgBankOffset(this._prgBank & 0xfe);
      this._prgOffsets[1] = this._prgBankOffset(this._prgBank | 0x01);
    } else if (this._prgMode === 2) {
      this._prgOffsets[0] = 0;
      this._prgOffsets[1] = this._prgBankOffset(this._prgBank);
    } else if (this._prgMode === 3) {
      this._prgOffsets[0] = this._prgBankOffset(this._prgBank);
      this._prgOffsets[1] = this._prgBankOffset(-1);
    }

    if (this._chrMode === 0) {
      this._chrOffsets[0] = this._chrBankOffset(this._chrBank0 & 0xfe);
      this._chrOffsets[1] = this._chrBankOffset(this._chrBank0 | 0x01);
    } else if (this._chrMode === 1) {
      this._chrOffsets[0] = this._chrBankOffset(this._chrBank0);
      this._chrOffsets[1] = this._chrBankOffset(this._chrBank1);
    }
  }
}

export class Mmc3Mapper implements IMapper {
  private _cartridge: Cartridge;
  private _cpu: Cpu;
  private _ppu: Ppu;

  private _register: number;
  private _registers: number[];
  private _prgMode: number;
  private _chrMode: number;
  private _prgOffsets: number[];
  private _chrOffsets: number[];
  private _reload: number;
  private _counter: number;
  private _irqEnable: boolean;

  constructor(cartridge: Cartridge) {
    this._cartridge = cartridge;

    this._register = 0;

    this._registers = [];
    for (let i = 0; i < 8; i++) {
      this._registers.push(0);
    }

    this._prgMode = 0;
    this._chrMode = 0;

    this._prgOffsets = [];
    for (let i = 0; i < 4; i++) {
      this._prgOffsets.push(0);
    }
    this._prgOffsets[0] = this._prgBankOffset(0);
    this._prgOffsets[1] = this._prgBankOffset(1);
    this._prgOffsets[2] = this._prgBankOffset(-2);
    this._prgOffsets[3] = this._prgBankOffset(-1);

    this._chrOffsets = [];
    for (let i = 0; i < 8; i++) {
      this._chrOffsets.push(0);
    }

    this._reload = 0;
    this._counter = 0;
    this._irqEnable = false;
  }

  set cpu(cpu: Cpu) {
    this._cpu = cpu;
  }

  set ppu(ppu: Ppu) {
    this._ppu = ppu;
  }

  get cartridge() {
    return this._cartridge;
  }

  public save() {
    return {
      register: this._register,
      registers: this._registers,
      prgMode: this._prgMode,
      chrMode: this._chrMode,
      prgOffsets: this._prgOffsets,
      chrOffsets: this._chrOffsets,
      reload: this._reload,
      counter: this._counter,
      irqEnable: this._irqEnable
    };
  }

  public load(state: any) {
    this._register = state.register;
    this._registers = state.registers;
    this._prgMode = state.prgMode;
    this._chrMode = state.chrMode;
    this._prgOffsets = state.prgOffsets;
    this._chrOffsets = state.chrOffsets;
    this._reload = state.reload;
    this._counter = state.counter;
    this._irqEnable = state.irqEnable;
  }

  public step() {
    if (this._ppu.cycles != 280) {
      return;
    }
    if (this._ppu.scanlines > 239 && this._ppu.scanlines < 261) {
      return;
    }
    if (
      !this._ppu.regPPUMASK_showBackground &&
      !this._ppu.regPPUMASK_showSprites
    ) {
      return;
    }

    this._handleScanline();
  }

  public read(address: number) {
    let bank = 0;
    let offset = 0;

    if (address < 0x2000) {
      bank = Math.trunc(address / 0x0400);
      offset = address % 0x0400;

      return this._cartridge.chr[this._chrOffsets[bank] + offset];
    } else if (address >= 0x8000) {
      const cleanAddress = address - 0x8000;
      bank = Math.trunc(cleanAddress / 0x2000);
      offset = cleanAddress % 0x2000;

      return this._cartridge.prg[this._prgOffsets[bank] + offset];
    } else if (address >= 0x6000) {
      return this._cartridge.sram[address - 0x6000];
    }
    return 0;
  }

  public write(address: number, value: number) {
    let bank = 0;
    let offset = 0;

    if (address < 0x2000) {
      bank = Math.trunc(address / 0x0400);
      offset = address % 0x0400;

      this._cartridge.chr[this._chrOffsets[bank] + offset] = value;
    } else if (address >= 0x8000) {
      this._writeRegister(address, value);
    } else if (address >= 0x6000) {
      this._cartridge.sram[address - 0x6000] = value;
    }
  }

  private _handleScanline() {
    if (this._counter === 0) {
      this._counter = this._reload;
    } else {
      this._counter--;
      if (this._counter === 0 && this._irqEnable) {
        this._cpu.requestInterrupt(InterruptRequestType.IRQ);
      }
    }
  }

  private _writeRegister(address: number, value: number) {
    if (address <= 0x9fff && address % 2 === 0) {
      this._writeBankSelect(value);
    } else if (address <= 0x9fff && address % 2 === 1) {
      this._writeBankData(value);
    } else if (address <= 0xbfff && address % 2 === 0) {
      this._writeMirror(value);
    } else if (address <= 0xbfff && address % 2 === 1) {
      this._writeProtect(value);
    } else if (address <= 0xdfff && address % 2 === 0) {
      this._writeIRQLatch(value);
    } else if (address <= 0xdfff && address % 2 === 1) {
      this._writeIRQReload(value);
    } else if (address <= 0xffff && address % 2 === 0) {
      this._writeIRQDisable(value);
    } else if (address <= 0xffff && address % 2 === 1) {
      this._writeIRQEnable(value);
    }
  }

  private _writeBankSelect(value: number) {
    this._prgMode = (value >>> 6) & 1;
    this._chrMode = (value >>> 7) & 1;
    this._register = value & 7;
    this._updateOffsets();
  }

  private _writeBankData(value: number) {
    this._registers[this._register] = value;
    this._updateOffsets();
  }

  private _writeMirror(value: number) {
    const mirror = value & 1;
    if (mirror === 0) {
      this._cartridge.mirror = MirrorMode.MirrorVertical;
    } else if (mirror === 1) {
      this._cartridge.mirror = MirrorMode.MirrorHorizontal;
    }
  }

  private _writeProtect(value: number) {}

  private _writeIRQLatch(value: number) {
    this._reload = value;
  }

  private _writeIRQReload(value: number) {
    this._counter = 0;
  }

  private _writeIRQDisable(value: number) {
    this._irqEnable = false;
  }

  private _writeIRQEnable(value: number) {
    this._irqEnable = true;
  }

  private _prgBankOffset(index: number) {
    let idx = index;
    if (idx >= 0x80) {
      idx -= 0x100;
    }

    idx = idx % Math.trunc(this.cartridge.prg.length / 0x2000);

    let offset = idx * 0x2000;
    if (offset < 0) {
      offset += this.cartridge.prg.length;
    }

    return offset;
  }

  private _chrBankOffset(index: number) {
    let idx = index;
    if (idx >= 0x80) {
      idx -= 0x100;
    }

    idx = idx % Math.trunc(this.cartridge.chr.length / 0x0400);

    let offset = idx * 0x0400;
    if (offset < 0) {
      offset += this.cartridge.chr.length;
    }

    return offset;
  }

  private _updateOffsets() {
    const prgMode = this._prgMode;
    if (prgMode === 0) {
      this._prgOffsets[0] = this._prgBankOffset(this._registers[6]);
      this._prgOffsets[1] = this._prgBankOffset(this._registers[7]);
      this._prgOffsets[2] = this._prgBankOffset(-2);
      this._prgOffsets[3] = this._prgBankOffset(-1);
    } else if (prgMode === 1) {
      this._prgOffsets[0] = this._prgBankOffset(-2);
      this._prgOffsets[1] = this._prgBankOffset(this._registers[7]);
      this._prgOffsets[2] = this._prgBankOffset(this._registers[6]);
      this._prgOffsets[3] = this._prgBankOffset(-1);
    }

    const chrMode = this._chrMode;
    if (chrMode === 0) {
      this._chrOffsets[0] = this._chrBankOffset(this._registers[0] & 0xfe);
      this._chrOffsets[1] = this._chrBankOffset(this._registers[0] | 0x01);
      this._chrOffsets[2] = this._chrBankOffset(this._registers[1] & 0xfe);
      this._chrOffsets[3] = this._chrBankOffset(this._registers[1] | 0x01);
      this._chrOffsets[4] = this._chrBankOffset(this._registers[2]);
      this._chrOffsets[5] = this._chrBankOffset(this._registers[3]);
      this._chrOffsets[6] = this._chrBankOffset(this._registers[4]);
      this._chrOffsets[7] = this._chrBankOffset(this._registers[5]);
    } else if (chrMode === 1) {
      this._chrOffsets[0] = this._chrBankOffset(this._registers[2]);
      this._chrOffsets[1] = this._chrBankOffset(this._registers[3]);
      this._chrOffsets[2] = this._chrBankOffset(this._registers[4]);
      this._chrOffsets[3] = this._chrBankOffset(this._registers[5]);
      this._chrOffsets[4] = this._chrBankOffset(this._registers[0] & 0xfe);
      this._chrOffsets[5] = this._chrBankOffset(this._registers[0] | 0x01);
      this._chrOffsets[6] = this._chrBankOffset(this._registers[1] & 0xfe);
      this._chrOffsets[7] = this._chrBankOffset(this._registers[1] | 0x01);
    }
  }
}

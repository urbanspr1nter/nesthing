import { Cartridge } from "./cartridge/cartridge";
import { MirrorMode } from "./cpu/constants";

export interface IMapper {
    save(): any;
    load(state: any);
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
        }
    }

    public load(state: any) {
        this._prgBanks = state.prgBanks;
        this._prgBank1 = state.prgBank1;
        this._prgBank2 = state.prgBank2;
    }

    public read(address: number) {
        if(address < 0x2000) {
            return this._cartridge.chr[address];
        } else if(address >= 0xC000) {
            var index = (this._prgBank2 * 0x4000) + (address - 0xC000);
            return this._cartridge.prg[index];
        } else if(address >= 0x8000) {
            var index = (this._prgBank1 * 0x4000) + (address - 0x8000);
            return this._cartridge.prg[index];
        } else if(address >= 0x6000) {
            var index = address - 0x6000;
            return this._cartridge.sram[index];
        }

        return 0;
    }

    public write(address: number, value: number) {
        if(address < 0x2000) {
            this._cartridge.chr[address] = value;
        } else if(address >= 0x8000) {
            this._prgBank1 = value % this._prgBanks;
        } else if(address >= 0x6000) {
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
        for(let i = 0; i < 2; i++) {
            this._prgOffsets[i] = 0;
        }
        this._prgOffsets[1] = this._prgBankOffset(-1);

        this._chrOffsets = [];
        for(let i = 0; i < 2; i++) {
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
        }
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
        if(address < 0x2000) {
            bank = Math.trunc(address / 0x1000);
            offset = address % 0x1000;
            return this._cartridge.chr[this._chrOffsets[bank] + offset];
        } else if(address >= 0x8000) {
            address = address - 0x8000;
            bank = Math.trunc(address / 0x4000);
            offset = address % 0x4000;
            return this._cartridge.prg[this._prgOffsets[bank] + offset];
        } else if(address >= 0x6000) {
            return this._cartridge.sram[address - 0x6000];
        }
        return 0;
    }

    public write(address: number, value: number): void {
        var bank = 0;
        var offset = 0;
        if(address < 0x2000) {
            bank = Math.trunc(address / 0x1000);
            offset = address % 0x1000;
            this._cartridge.chr[this._chrOffsets[bank] + offset] = value & 0xff;
        } else if(address >= 0x8000) {
            this._loadRegister(address, value);
        } else if(address >= 0x6000) {
            this._cartridge.sram[address - 0x6000] = value;
        }
    }

    public step(): void {
        return;
    }

    private _loadRegister(address: number, value: number) {
        if((value & 0x80) === 0x80) {
            this._shiftRegister = 0x10;
            this._writeControl(this._control | 0x0C);
        } else {
            var complete = (this._shiftRegister & 1) === 1;
            this._shiftRegister >>>= 1;
            this._shiftRegister |= (value & 1) << 4;
            if(complete) {
                this._writeRegister(address, this._shiftRegister);
                this._shiftRegister = 0x10;
            }
        }
    }

    private _writeRegister(address: number, value: number) {
        if(address <= 0x9FFF) {
            this._writeControl(value);
        } else if(address <= 0xBFFF) {
            this._writeCHRBank0(value);
        } else if(address <= 0xDFFF) {
            this._writeCHRBank1(value);
        } else if(address <= 0xFFFF) {
            this._writePRGBank(value);
        }
    }

    private _writeControl(value: number) {
        this._control = value;
        this._chrMode = (value >>> 4) & 1;
        this._prgMode = (value >>> 2) & 3;
        
        var mirror = value & 3;

        if(mirror === 0) {
            this._cartridge.mirror = MirrorMode.MirrorSingle0;
        } else if(mirror === 1) {
            this._cartridge.mirror = MirrorMode.MirrorSingle1;
        } else if(mirror === 2) {
            this._cartridge.mirror = MirrorMode.MirrorVertical;
        } else if(mirror === 3) {
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
        if(idx >= 0x80) {
            idx -= 0x100;
        }

        idx = idx % Math.trunc(this._cartridge.prg.length / 0x4000);
        
        var offset = idx * 0x4000;
        if(offset < 0) {
            offset += this._cartridge.prg.length;
        }

        return offset;
    }

    private _chrBankOffset(index: number) {
        var idx = index;

        if(idx >= 0x80) {
            idx -= 0x100;
        }

        idx = idx % Math.trunc(this._cartridge.chr.length / 0x1000);

        var offset = idx * 0x1000;
        if(offset < 0) {
            offset += this._cartridge.chr.length;
        }

        return offset;
    }

    private _updateOffsets() {
        if(this._prgMode === 0 || this._prgMode === 1) {
            this._prgOffsets[0] = this._prgBankOffset(this._prgBank & 0xFE);
            this._prgOffsets[1] = this._prgBankOffset(this._prgBank | 0x01);
        } else if(this._prgMode === 2) {
            this._prgOffsets[0] = 0;
            this._prgOffsets[1] = this._prgBankOffset(this._prgBank);
        } else if(this._prgMode === 3) {
            this._prgOffsets[0] = this._prgBankOffset(this._prgBank);
            this._prgOffsets[1] = this._prgBankOffset(-1);
        }

        if(this._chrMode === 0) {
            this._chrOffsets[0] = this._chrBankOffset(this._chrBank0 & 0xFE);
            this._chrOffsets[1] = this._chrBankOffset(this._chrBank0 | 0x01);
        } else if(this._chrMode === 1) {
            this._chrOffsets[0] = this._chrBankOffset(this._chrBank0);
            this._chrOffsets[1] = this._chrBankOffset(this._chrBank1);
        }
    }
}
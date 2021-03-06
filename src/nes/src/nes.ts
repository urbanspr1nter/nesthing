import { Memory, MemoryState } from "./memory";
import { Ppu } from "./ppu/ppu";
import { Cpu } from "./cpu/cpu";
import { CartridgeLoader } from "./cartridge/cartridge-loader";
import { Controller } from "./controller";
import { Apu } from "./apu/apu";
import { UiSoundHandler } from "./ui/soundhandler";
import { UiFrameBuffer } from "./ui/framebuffer";
import { UiKeyHandler } from "./ui/keyhandler";
import { IMapper, NromMapper, Mmc1Mapper, Mmc3Mapper, AoromMapper } from "./mapper";
import { Cartridge } from "./cartridge/cartridge";
import RomManager, { Roms } from "./ui/rommanager";
import { ApuState } from "./apu/constants";
import { PpuState } from "./ppu/constants";
import { CartridgeState } from "./cartridge/constants";
import { CpuState } from "./cpu/constants";

export interface ConsoleState {
  currentRom: Roms,
  cpu: CpuState,
  ppu: PpuState,
  apu: ApuState,
  memory: MemoryState,
  cartridge: CartridgeState,
  mapper: any
}

export interface ControllerSet {
  one: Controller;
  two: Controller;
}
export interface NesOptions {
  keyHandler: UiKeyHandler;
  frameRenderer: UiFrameBuffer;
  controller: ControllerSet;
  rom: Roms;
}

export enum Mapper {
  NROM = 0,
  MMC1 = 1,
  UNROM = 2,
  MMC3 = 4,
  AOROM = 7
}
export class Nes {
  private _currentRom: Roms;
  private _rom: any;
  private _memory: Memory;
  private _apu: Apu;
  private _ppu: Ppu;
  private _cpu: Cpu;
  private _mapper: IMapper;
  private _cartridge: Cartridge;
  private _uiSoundHandler: UiSoundHandler;

  private _controllerOne: Controller;
  private _controllerTwo: Controller;

  constructor(options: NesOptions, pf: any) {
    this._rom = RomManager.getRomData(options.rom);
    this._currentRom = options.rom;
    const romContents = this._rom.raw as number[];
    const cartLoader = new CartridgeLoader(romContents);
    this._cartridge = cartLoader.makeCartridge();

    if (this._cartridge.mapper === Mapper.NROM) {
      this._mapper = new NromMapper(this._cartridge);
    } else if (this._cartridge.mapper === Mapper.MMC1) {
      this._mapper = new Mmc1Mapper(this._cartridge);
    } else if (this._cartridge.mapper === Mapper.UNROM) {
      this._mapper = new NromMapper(this._cartridge);
    } else if(this._cartridge.mapper === Mapper.MMC3) {
      this._mapper = new Mmc3Mapper(this._cartridge);
    } else if(this._cartridge.mapper === Mapper.AOROM) {
      this._mapper = new AoromMapper(this._cartridge);
    }

    this._controllerOne = options.controller.one;
    this._controllerTwo = options.controller.two;

    this._uiSoundHandler = new UiSoundHandler(0.8);

    this._apu = new Apu(this._uiSoundHandler, 44100, pf);
    this._ppu = new Ppu(options.frameRenderer, this._mapper, pf);
    this._memory = new Memory(
      this._ppu,
      this._apu,
      this._mapper,
      this._controllerOne,
      this._controllerTwo
    );

    this._cpu = new Cpu(this._memory);
    this._apu.setCpu(this._cpu);
    this._ppu.cpu = this._cpu;

    if(this._cartridge.mapper === Mapper.MMC3) {
      (this._mapper as Mmc3Mapper).cpu = this._cpu;
      (this._mapper as Mmc3Mapper).ppu = this._ppu;
    }

    this._initialize();
  }

  get rom(): Roms {
    return this._currentRom;
  }

  get controller1(): Controller {
    return this._controllerOne;
  }

  get controller2(): Controller {
    return this._controllerTwo;
  }

  get ppuFrames(): number {
    return this._ppu.frames;
  }

  get scanlines(): number {
    return this._ppu.scanlines;
  }

  get ppuCycles(): number {
    return this._ppu.cycles;
  }

  public reset() {
    this._cpu.powerUp();
  }

  public save() {
    return {
      currentRom: this._currentRom,
      cpu: this._cpu.save(),
      ppu: this._ppu.save(),
      apu: this._apu.save(),
      memory: this._memory.save(),
      cartridge: this._cartridge.save(),
      mapper: this._mapper.save()
    }
  }

  public load(state: ConsoleState) {
    this._currentRom = state.currentRom;
    this._memory.load(state.memory);
    this._cpu.load(state.cpu);
    this._ppu.load(state.ppu);
    this._apu.load(state.apu);
    this._cartridge.load(state.cartridge);
    this._mapper.load(state.mapper);

    // No state needed to be passed.
    this._uiSoundHandler.load();
  }

  public run(): number {
    const totalCpuSteps = this._cpu.step();

    for (let i = 0; i < totalCpuSteps; i++) {
      this._apu.step();
    }

    const totalPpuSteps = totalCpuSteps * 3;
    for (let i = 0; i < totalPpuSteps; i++) {
      this._ppu.step();
      this._mapper.step();
    }

    return totalCpuSteps;
  }

  private _initialize() {
    this._cpu.powerUp();
  }
}

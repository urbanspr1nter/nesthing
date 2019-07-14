import { Memory } from "./memory";
import { Ppu } from "./ppu";
import { Cpu } from "./cpu";
import { CartLoader } from "./cart-loader";
import { Controller } from "./controller";
import { Apu } from "./apu";
import { UiSoundHandler } from "./ui/soundhandler";
import { UiFrameBuffer } from "./ui/framebuffer";
import { UiKeyHandler } from "./ui/keyhandler";
import { IMapper, NromMapper, Mmc1Mapper } from "./mapper";
import { Cartridge } from "./cartridge";
import RomManager from "./ui/rommanager";
import { Roms } from "./ui/constants";

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
  MMC1 = 1
}
export class Nes {
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

  constructor(options: NesOptions) {
    this._rom = RomManager.getRomData(options.rom);

    const romContents = this._rom.raw as number[];
    const cartLoader = new CartLoader(romContents);
    this._cartridge = cartLoader.makeCartridge();

    if (this._cartridge.mapper === Mapper.NROM) {
      this._mapper = new NromMapper(this._cartridge);
    } else if (this._cartridge.mapper === Mapper.MMC1) {
      this._mapper = new Mmc1Mapper(this._cartridge);
    }

    this._controllerOne = options.controller.one;
    this._controllerTwo = options.controller.two;

    this._uiSoundHandler = new UiSoundHandler(0.8);

    this._apu = new Apu(this._uiSoundHandler, 44100);
    this._ppu = new Ppu(options.frameRenderer, this._mapper);
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

    this._initialize();
  }

  get controller1(): Controller {
    return this._controllerOne;
  }

  get controller2(): Controller {
    return this._controllerTwo;
  }

  public cpuMemory(): number[] {
    return this._memory.bits();
  }

  get ppuFrames(): number {
    return this._ppu.frames;
  }

  public scanlines(): number {
    return this._ppu.scanlines;
  }

  public ppuCycles(): number {
    return this._ppu.cycles;
  }

  public run(): number {
    var totalCpuSteps = this._cpu.step();

    for (let i = 0; i < totalCpuSteps; i++) {
      this._apu.step();
    }

    var totalPpuSteps = totalCpuSteps * 3;
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

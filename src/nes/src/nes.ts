import { Memory } from "./memory";
import { Ppu } from "./ppu";
import { Cpu } from "./cpu";
import { CartLoader } from "./cart-loader";
import { Controller } from "./controller";
import { Apu } from "./apu";
import { UiSoundHandler } from "./ui/soundhandler";
import { UiFrameBuffer } from "./ui/framebuffer";
import { UiKeyHandler } from "./ui/keyhandler";
import { Mapper2, IMapper } from "./mapper";
import { Cartridge } from "./cartridge";

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

export enum Roms {
  MarioBros,
  DonkeyKong,
  SpaceInvaders,
  F1Race
}
export const RomFiles = {
  MarioBros: require("./roms/mario.json"),
  DonkeyKong: require("./roms/donkey.json"),
  SpaceInvaders: require("./roms/space.json"),
  F1Race: require("./roms/f1race.json")
};

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
    if (options.rom === Roms.MarioBros) {
      this._rom = RomFiles.MarioBros;
    } else if (options.rom === Roms.DonkeyKong) {
      this._rom = RomFiles.DonkeyKong;
    } else if (options.rom === Roms.SpaceInvaders) {
      this._rom = RomFiles.SpaceInvaders;
    } else if(options.rom === Roms.F1Race) {
      this._rom = RomFiles.F1Race;
    }

    const romContents = this._rom.raw as number[];
    const cartLoader = new CartLoader(romContents);
    this._cartridge = cartLoader.makeCartridge();
    this._mapper = new Mapper2(this._cartridge);
    

    this._controllerOne = options.controller.one;
    this._controllerTwo = options.controller.two;

    this._uiSoundHandler = new UiSoundHandler(0.8);

    this._apu = new Apu(this._uiSoundHandler, 44100);
    this._ppu = new Ppu(options.frameRenderer, this._mapper);
    this._memory = new Memory(this._ppu, this._apu, this._controllerOne, this._controllerTwo);
    this._memory.mapper = this._mapper;

    this._cpu = new Cpu(this._memory);
    this._apu.setCpu(this._cpu);
    this._ppu.setCpu(this._cpu);
    

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
    return this._ppu.getScanlines();
  }

  public ppuCycles(): number {
    return this._ppu.getCycles();
  }

  public loadRom() {

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
    this.loadRom();
    this._cpu.powerUp();
  }
}

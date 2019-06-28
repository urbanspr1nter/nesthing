import { Memory } from "./memory";
import { Ppu } from "./ppu";
import { Cpu } from "./cpu";
import { PpuMemory } from "./ppumemory";
import { CartLoader } from "./cart-loader";
import { Controller } from "./controller";
import { Apu } from "./apu";
import { UiSoundHandler } from "./ui/ui.soundhandler";
import { UiFrameBuffer } from "./ui/ui.framebuffer";
import { UiKeyHandler } from "./ui/ui.keyhandler";

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
  SpaceInvaders
}
export const RomFiles = {
  MarioBros: require("./roms/mario.json"),
  DonkeyKong: require("./roms/donkey.json"),
  SpaceInvaders: require("./roms/space.json")
};

export class Nes {
  private _rom: any;
  private _memory: Memory;
  private _ppuMemory: PpuMemory;
  private _apu: Apu;
  private _ppu: Ppu;
  private _cpu: Cpu;
  private _uiSoundHandler: UiSoundHandler;

  private _controllerOne: Controller;
  private _controllerTwo: Controller;

  private _cpuTimeInFrame: number;
  private _apuTimeInFrame: number;
  private _ppuTimeInFrame: number;
  private _startTime: number;

  constructor(options: NesOptions) {
    if (options.rom === Roms.MarioBros) {
      this._rom = RomFiles.MarioBros;
    } else if (options.rom === Roms.DonkeyKong) {
      this._rom = RomFiles.DonkeyKong;
    } else if (options.rom === Roms.SpaceInvaders) {
      this._rom = RomFiles.SpaceInvaders;
    }

    this._ppuMemory = new PpuMemory();
    this._ppu = new Ppu(this._ppuMemory, options.frameRenderer);
    this._controllerOne = options.controller.one;
    this._controllerTwo = options.controller.two;

    this._uiSoundHandler = new UiSoundHandler(0.8);

    this._apu = new Apu(this._uiSoundHandler, 44100);
    this._memory = new Memory(this._ppu, this._apu, this._controllerOne, this._controllerTwo);
    this._cpu = new Cpu(this._memory);

    this._apu.setCpu(this._cpu);
    this._ppu.setCpuMemory(this._memory);
    this._ppu.setCpu(this._cpu);
    this._initialize();

    this._cpuTimeInFrame = 0;
    this._ppuTimeInFrame = 0;
    this._apuTimeInFrame = 0;
    this._startTime = 0;
  }

  private _resetTimes() {
    this._cpuTimeInFrame = 0;
    this._ppuTimeInFrame = 0;
    this._apuTimeInFrame = 0;
  }

  private _markStart() {
    this._startTime = performance.now();
  }

  get controller1(): Controller {
    return this._controllerOne;
  }

  get controller2(): Controller {
    return this._controllerTwo;
  }

  get readyToRender() {
    return this._ppu.frameDrawn;
  }

  set readyToRender(value: boolean) {
    this._ppu.frameDrawn = value;
  }

  public cpuMemory(): number[] {
    return this._memory.bits();
  }

  public ppuMemory(): number[] {
    return this._ppuMemory.bits();
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
    const romContents = this._rom.raw as number[];
    const cartLoader = new CartLoader(romContents);
    cartLoader.loadCartridgeData(this._memory, this._ppuMemory);
  }

  public run(): number {
    this._markStart();
    var totalCpuSteps = this._cpu.step();
    this._cpuTimeInFrame += performance.now() - this._startTime;

    this._markStart();
    for (let i = 0; i < totalCpuSteps; i++) {
      this._apu.step();
    }
    this._apuTimeInFrame += performance.now() - this._startTime;

    this._markStart();
    var totalPpuSteps = totalCpuSteps * 3;
    for (let i = 0; i < totalPpuSteps; i++) {
      this._ppu.step();
    }
    this._ppuTimeInFrame += performance.now() - this._startTime;

    if (!!this.readyToRender) {
      {
        let totalTimeInFrame =
          this._cpuTimeInFrame + this._apuTimeInFrame + this._ppuTimeInFrame;
        let maxFrameTime = 1000 / 60;
        if (totalTimeInFrame > maxFrameTime) {
          console.warn(
            `Total frame time: ${totalTimeInFrame} has exceeded max time per frame: ${maxFrameTime} by ${totalTimeInFrame -
              maxFrameTime}`
          );
        }
      }
      this._resetTimes();
    }
    return totalCpuSteps;
  }

  private _initialize() {
    this.loadRom();
    this._cpu.powerUp();
  }
}

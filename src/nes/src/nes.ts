import { Memory } from "./memory";
import { Ppu } from "./ppu";
import { Cpu } from "./cpu";
import { PpuMemory } from "./ppumemory";
import { CartLoader } from "./cart-loader";
import { Controller } from "./controller";
import { Apu } from "./apu";
import { EventEmitter } from "events";
import { UiSoundHandler } from "./ui/ui.soundhandler";

export enum Roms {
  MarioBros,
  DonkeyKong,
  SpaceInvaders
}
export const RomFiles = {
  MarioBros: require("./roms/mario.json"),
  DonkeyKong: require("./roms/donkey.json"),
  SpaceInvaders: require("./roms/space.json")
}

export class Nes {
  private _rom: any;
  private _memory: Memory;
  private _ppuMemory: PpuMemory;
  private _apu: Apu;
  private _ppu: Ppu;
  private _cpu: Cpu;
  private _controller: Controller;
  private _eventListener: EventEmitter;
  private _uiSoundHandler: UiSoundHandler;

  private _cpuTimeInFrame: number;
  private _apuTimeInFrame: number;
  private _ppuTimeInFrame: number;
  private _startTime: number;

  constructor(eventEmitter: EventEmitter, rom: Roms) {
    if(rom === Roms.MarioBros) {
      this._rom = RomFiles.MarioBros;
    } else if(rom === Roms.DonkeyKong) {
      this._rom = RomFiles.DonkeyKong;
    } else if(rom === Roms.SpaceInvaders) {
      this._rom = RomFiles.SpaceInvaders;
    }

    this._ppuMemory = new PpuMemory();
    this._ppu = new Ppu(this._ppuMemory);
    this._controller = new Controller();

    this._eventListener = eventEmitter;

    this._uiSoundHandler = new UiSoundHandler(0.8, this._eventListener);

    this._apu = new Apu(this._eventListener, 44100);
    this._memory = new Memory(this._ppu, this._apu, this._controller);
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
    return this._controller;
  }

  get readyToRender() {
    return this._ppu.frameDrawn;
  }

  public setReadyToRender(value: boolean) {
    this._ppu.frameDrawn = value;
  }
  
  public cpuMemory(): number[] {
    return this._memory.bits();
  }

  public ppuMemory(): number[] {
    return this._ppuMemory.bits();
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
    var totalCpuSteps = this._cpu.step();

    for(let i = 0 ; i < totalCpuSteps; i++) {
      this._apu.step();
    }

    var totalPpuSteps = totalCpuSteps * 3;
    for(let i = 0; i < totalPpuSteps; i++) {
      this._ppu.step();
    }

    return totalCpuSteps;
  }

  private _initialize() {
    this.loadRom();
    this._cpu.powerUp();
  }
}

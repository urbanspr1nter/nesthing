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

export interface CpuRegisters {
  pc: number;
  a: number;
  x: number;
  y: number;
  sp: number;
  p: number;
}

export interface PpuRegisters {
  v: number;
  t: number;
  x: number;
  w: boolean;
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
  private _readyToRender: boolean;

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
    this._eventListener.on("renderFrame", () => {
      this._readyToRender = true;
    });

    this._uiSoundHandler = new UiSoundHandler(0.8, this._eventListener);

    this._apu = new Apu(this._eventListener, 44100);
    this._memory = new Memory(this._ppu, this._apu, this._controller);
    this._cpu = new Cpu(this._memory);

    this._apu.setCpu(this._cpu);
    this._ppu.setCpuMemory(this._memory);
    this._ppu.setCpu(this._cpu);
    this._initialize();
  }

  get controller1(): Controller {
    return this._controller;
  }

  get readyToRender() {
    return this._readyToRender;
  }

  public setReadyToRender(value: boolean) {
    this._readyToRender = value;
  }

  public frameBuffer(): string[][] {
    return this._ppu.frameBuffer();
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
  public ppuRegisers(): PpuRegisters {
    return {
      v: this._ppu.vramAddress(),
      t: this._ppu.tVramAddress(),
      x: this._ppu.fineX(),
      w: this._ppu.vramAddressWriteToggle()
    };
  }

  public cpuRegisters(): CpuRegisters {
    return {
      pc: this._cpu.getPC(),
      a: this._cpu.getA(),
      x: this._cpu.getX(),
      y: this._cpu.getY(),
      sp: this._cpu.getSP(),
      p: this._cpu.getP()
    };
  }

  public loadRom() {
    const romContents = this._rom.raw as number[];
    const cartLoader = new CartLoader(romContents);
    cartLoader.loadCartridgeData(this._memory, this._ppuMemory);
  }

  public run(): number {
    let start = performance.now();

    let totalCpuSteps: number = 0;

    totalCpuSteps += this._cpu.step();

    let totalApuSteps = totalCpuSteps;
    while (totalApuSteps > 0) {
      this._apu.step();
      totalApuSteps--;
    }

    let totalPpuSteps = totalCpuSteps * 3;
    while (totalPpuSteps > 0) {
      this._ppu.step();
      totalPpuSteps--;
    }

    return totalCpuSteps;
  }

  private _initialize() {
    this.loadRom();
    this._cpu.powerUp();
  }
}

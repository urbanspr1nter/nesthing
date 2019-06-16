import { Memory } from "./memory";
import { Ppu } from "./ppu";
import { Cpu } from "./cpu";
import { PpuMemory } from "./ppumemory";
import { CartLoader } from "./cart-loader";
import { Controller } from "./controller";
import { Apu } from "./apu";

const rom = require("./roms/mario.json");

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
  private _memory: Memory;
  private _ppuMemory: PpuMemory;
  private _apu: Apu;
  private _ppu: Ppu;
  private _cpu: Cpu;
  private _controller: Controller;

  private _audioContext: AudioContext;

  constructor() {
    this._ppuMemory = new PpuMemory();
    this._ppu = new Ppu(this._ppuMemory);
    this._controller = new Controller();
    this._apu = new Apu();
    this._memory = new Memory(this._ppu, this._apu, this._controller);
    this._cpu = new Cpu(this._memory);

    this._apu.setCpu(this._cpu);
    this._apu.setAudioSampleRate(44100);
    this._ppu.setCpuMemory(this._memory);
    this._ppu.setCpu(this._cpu);
    this._initialize();
    }

  get controller1(): Controller {
    return this._controller;
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

  public cpuTotalCycles(): number {
    return this._cpu.totalCycles();
  }

  public clearTotalCycles(): void {
    this._cpu.clearCycles();
  }

  public snapNt() {
    return this._ppuMemory.snapNt();
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

  public log() {
    return this._cpu.getLog();
  }

  public loadRom() {
    const romContents = rom.raw;
    const cartLoader = new CartLoader(romContents);
    cartLoader.loadCartridgeData(this._memory, this._ppuMemory);
  }

  public run(steps: number): number {
    if(!    this._audioContext
    ) {
      this._audioContext = new AudioContext();
    }
    let totalCpuSteps: number = 0;

    while (totalCpuSteps < steps) {
      totalCpuSteps += this._cpu.step();
    }
    
    let totalApuSteps = totalCpuSteps;
    while(totalApuSteps > 0) {
      this._apu.step();
      totalApuSteps--;
    }

    const bufferData = this._audioContext.createBuffer(2, 4096, 44100);
    
    const bufferSource = this._audioContext.createBufferSource();
    bufferSource.connect(this._audioContext.destination);

  
    const channelData = bufferData.getChannelData(1);
    for(let i = 0; i < 4096; i++) {
      channelData[i] = this._apu.getAudioChannel();

    }

    bufferSource.buffer = bufferData;
    bufferSource.start();
    bufferSource.stop(this._audioContext.currentTime + 1);

    const cpuSteps = totalCpuSteps;

    let totalPpuSteps = cpuSteps * 3;
    while (totalPpuSteps > 0) {
      this._ppu.step();
      totalPpuSteps--;
    }

    return cpuSteps;
  }

  private _initialize() {
    this.loadRom();
    this._cpu.powerUp();
  }
}

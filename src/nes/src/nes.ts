import { Memory } from "./memory";
import { Ppu } from "./ppu";
import { Cpu } from "./cpu";
import { PpuMemory } from "./ppumemory";
import { CartLoader } from "./cart-loader";
import { Controller } from "./controller";
import { Apu } from "./apu";
import { EventEmitter } from "events";

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
  private _audioListener: EventEmitter;

  private _audioBuffer: number[];
  private _audioContext: AudioContext;
  private _gainNode: GainNode;
  private _audioAudioBuffer: AudioBuffer;

  constructor() {
    this._ppuMemory = new PpuMemory();
    this._ppu = new Ppu(this._ppuMemory);
    this._controller = new Controller();

    this._audioContext = new AudioContext();


    const gainNode = this._audioContext.createGain();
    gainNode.gain.value = 0.75;
    gainNode.connect(this._audioContext.destination);

    const buffer = this._audioContext.createBuffer(1, 8192, 44100);
    this._audioAudioBuffer = buffer;

    this._gainNode = gainNode;

    this._audioBuffer = [];
    this._audioListener = new EventEmitter();
    this._audioListener.on("onsamplereceive", (value) => {

      if(this._audioBuffer.length === 8192) {
        const channelData = this._audioAudioBuffer.getChannelData(0);

        channelData.set(this._audioBuffer.slice(0, 8192));

        this._audioBuffer= [];

        const bufferSource = this._audioContext.createBufferSource();
        bufferSource.buffer = this._audioAudioBuffer;

        bufferSource.connect(this._gainNode);
        bufferSource.start();
      }

      this._audioBuffer.push(value);

    });

    this._apu = new Apu(this._audioListener);
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
    let totalCpuSteps: number = 0;

    while (totalCpuSteps < steps) {
      totalCpuSteps += this._cpu.step();
    }

    let totalApuSteps = totalCpuSteps;
    while (totalApuSteps > 0) {
      this._apu.step();
      totalApuSteps--;
    }

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

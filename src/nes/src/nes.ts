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

const AUDIO_BUFFER_LENGTH = 4096;
const AUDIO_SAMPLE_RATE = 44100;

export class Nes {
  private _memory: Memory;
  private _ppuMemory: PpuMemory;
  private _apu: Apu;
  private _ppu: Ppu;
  private _cpu: Cpu;
  private _controller: Controller;
  private _eventListener: EventEmitter;

  private _audioBuffer: number[];
  private _workingAudioBuffer: number[];
  private _audioBufferQueue: number[][];
  private _audioBufferSource: AudioBufferSourceNode;
  private _audioContext: AudioContext;
  private _gainNode: GainNode;
  private _audioAudioBuffer: AudioBuffer;

  constructor(eventEmitter: EventEmitter) {
    this._ppuMemory = new PpuMemory();
    this._ppu = new Ppu(this._ppuMemory);
    this._controller = new Controller();

    this._audioContext = new AudioContext();

    const gainNode = this._audioContext.createGain();
    gainNode.gain.value = 0.75;
    gainNode.connect(this._audioContext.destination);

    const buffer = this._audioContext.createBuffer(
      1,
      AUDIO_BUFFER_LENGTH,
      AUDIO_SAMPLE_RATE
    );
    this._audioAudioBuffer = buffer;
    this._gainNode = gainNode;

    this._audioBuffer = [];
    this._workingAudioBuffer = [];
    this._audioBufferQueue = [];

    this._eventListener = eventEmitter;

    this._eventListener.on("onsamplereceive", value => {
      if (this._workingAudioBuffer.length >= AUDIO_BUFFER_LENGTH) {
        this._audioBufferQueue.push(this._workingAudioBuffer);
        this._workingAudioBuffer = [];

        if(!this._audioBuffer) {
          this._audioBuffer = this._audioBufferQueue.shift();
          const channelData0 = this._audioAudioBuffer.getChannelData(0);
          channelData0.set(this._audioBuffer);
        }

        this._audioBufferSource = this._audioContext.createBufferSource();

        this._audioBufferSource.onended = () => {
          if(this._audioBufferQueue.length > 0) {
            this._audioBuffer = this._audioBufferQueue.shift();
          }
          const channelData0 = this._audioAudioBuffer.getChannelData(0);
          channelData0.set(this._audioBuffer);
        };

        this._audioBufferSource.connect(this._gainNode);
        this._audioBufferSource.buffer = this._audioAudioBuffer;
        this._audioBufferSource.start();
      }

      this._workingAudioBuffer.push(value);
    });

    this._apu = new Apu(this._eventListener, AUDIO_SAMPLE_RATE);
    this._memory = new Memory(this._ppu, this._apu, this._controller);
    this._cpu = new Cpu(this._memory);

    this._apu.setCpu(this._cpu);
    this._apu.setAudioSampleRate(AUDIO_SAMPLE_RATE);
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

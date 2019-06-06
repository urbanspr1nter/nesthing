import { Memory } from "./memory";
import { Ppu } from "./ppu";
import { Cpu } from "./cpu";
import { PpuMemory } from "./ppumemory";
import { CartLoader } from "./cart-loader";
import { Controller } from "./controller";

const rom = require("./nestest.json");

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
  private _ppu: Ppu;
  private _cpu: Cpu;
  private _nmiTriggered: boolean;
  private _cycles: number;
  private _controller: Controller;

  constructor() {
    this._ppuMemory = new PpuMemory();
    this._ppu = new Ppu(this._ppuMemory);
    this._controller = new Controller();
    this._memory = new Memory(this._ppu, this._controller);
    this._cpu = new Cpu(this._memory);

    this._ppu.setCpuMemory(this._memory);
    this._ppu.setCpu(this._cpu);
    this._initialize();

    this._cycles = 0;
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

  public cpuNmiRequested(): boolean {
    return this._nmiTriggered;
  }

  public cpuTotalCycles(): number {
    return this._cpu.totalCycles();
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
    // For now, we can only load Donkey Kong
    const romBytes: number[] = [];

    const romContents = rom.raw;
    const cartLoader = new CartLoader(romContents);
    cartLoader.loadCartridgeData(this._memory, this._ppuMemory);

    // Initialize the nametables to $00
    let ntStartAddress = 0x2000;
    for (let i = ntStartAddress; i < 0x3f00; i++) {
      this._ppuMemory.set(i, 0x00);
    }
  }

  public run(cyclesToRun: number): number {
    /**
     * The general approach to this run loop is to simulate both the CPU, PPU and APU
     * all running at the same time. Each piece of hardware will run for the necessary amount of
     * cycles.
     */

     // let cpuTime = 0;
     // let ppuTime = 0;
    while(this._cycles <= cyclesToRun) {
      // let start = performance.now();

      const beginCpuCycles = this._cpu.getCurrentCycles();

      if (this._cpu.stallCycles() > 0) {
        this._cpu.runStallCycle();
      } else {
        // If we are entering in VBLANK, Enter NMI handling routine!
        this._nmiTriggered = this._ppu.cpuNmiRequested();
        if (this._nmiTriggered) {
          this._cpu.setupNmi();
        }
  
        console.log(this._cpu.getPC().toString(16));
        const opCode = this._memory.get(this._cpu.getPC());
        this._cpu.handleOp(opCode);
      }
  
      const cpuCyclesRan = this._cpu.getCurrentCycles() - beginCpuCycles;
      
      // cpuTime += (performance.now() - start);
      // start = performance.now();

      let ppuCyclesToRun = cpuCyclesRan * 3;
      this._ppu.run(ppuCyclesToRun);

      // ppuTime += (performance.now() - start);
  
      this._cycles += cpuCyclesRan;
    }

    const cyclesRan = this._cycles;
    this._cycles = 0;

    // console.log(`CPU TIME: ${cpuTime}, PPU TIME: ${ppuTime}, TOTAL TIME: ${cpuTime + ppuTime}`);

    return cyclesRan;
  }

  private _initialize() {
    this.loadRom();
    this._cpu.powerUp();
  }
}

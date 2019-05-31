import { Memory } from "./memory";
import { Ppu } from "./ppu";
import { Cpu } from "./cpu";
import { PpuMemory } from "./ppumemory";
import { CartLoader } from "./cart-loader";
import { Controller, Buttons } from "./controller";

const rom = require("./mario.json");

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

    document.addEventListener("keydown", (e) => {
      const map: { [id: number]: boolean } = {
        0: false,
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false
    };

      if(e.key === 'h') {
        map[Buttons.Start] = true;
      } 
      if(e.key === 'g') {
        map[Buttons.Select] = true;
      }
      if(e.key === 'j') {
        map[Buttons.A] = true;
      } 
      if(e.key === 'k') {
        map[Buttons.B] = true;
      } 
      if(e.key === 's') {
        map[Buttons.Down] = true;
      } 
      if(e.key === 'w') {
        map[Buttons.Up] = true;
      }
      if(e.key === 'a') {
        map[Buttons.Left] = true;
      }
      if(e.key === 'd') {
        map[Buttons.Right] = true;
      }

      this._controller.setButtons(map);
    });

    document.addEventListener("keyup", (e) => {
      const map: { [id: number]: boolean } = {
        0: false,
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false
    };

      if(e.key === 'h') {
        map[Buttons.Start] = false;
      } 
      if(e.key === 'g') {
        map[Buttons.Select] = false;
      }
      if(e.key === 'j') {
        map[Buttons.A] = false;
      } 
      if(e.key === 'k') {
        map[Buttons.B] = false;
      } 
      if(e.key === 's') {
        map[Buttons.Down] = false;
      } 
      if(e.key === 'w') {
        map[Buttons.Up] = false;
      }
      if(e.key === 'a') {
        map[Buttons.Left] = false;
      }
      if(e.key === 'd') {
        map[Buttons.Right] = false;
      }

      this._controller.setButtons(map);
    });
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

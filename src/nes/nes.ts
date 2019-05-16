import { Memory } from "../memory/memory";
import { Ppu } from "../ppu/ppu";
import { ColorComponent } from "./common/interface";
import { Cpu } from "../cpu/cpu";
import { PpuMemory } from "../memory/ppumemory";
import * as rom from "./rom.json";
import { LogUtil } from "../cpu/log.util";

const ROM_FILE = "./DK.nes";

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

  private _logger: LogUtil;

  constructor() {
    this._logger = new LogUtil(10000);
    this._ppuMemory = new PpuMemory();

    this._ppu = new Ppu(this._ppuMemory);
    this._memory = new Memory(this._ppu);
    this._cpu = new Cpu(this._memory, this._logger);

    this._initialize();

    this._cpu.debugMode(false);

    this._cycles = 0;
  }

  public frameBuffer(): ColorComponent[][] {
    return this._ppu.frameBuffer();
  }

  public cpuMemory(): number[] {
    return this._memory.bits;
  }

  public ppuMemory(): number[] {
    return this._ppuMemory.bits;
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

  public logEntries(): string[] {
    return this._logger.entries;
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
    romContents.forEach(value => {
      romBytes.push(value);
    });

    let currentAddress = 0x8000;
    // Load PRG ROM from 0x8000 -> 0xBFFF
    for (
      let i = 0;
      i < romBytes.length && currentAddress < 0xc000;
      i++, currentAddress++
    ) {
      this._memory.set(currentAddress, romBytes[i]);
    }

    // Load PRG ROM from 0xC000 -> 0xFFFF (Mirror of 0x8000->0xBFFF)
    currentAddress = 0xc000;
    for (
      let i = 0;
      i < romBytes.length && currentAddress <= 0xffff;
      i++, currentAddress++
    ) {
      this._memory.set(currentAddress, romBytes[i]);
    }

    // Load the CHR ROM
    let chrRomAddress = 0x4000;
    for (let i = 0x0000; i <= 0x1fff; i++) {
      this._ppuMemory.set(i, romBytes[chrRomAddress]);
      chrRomAddress++;
    }

    // Initialize the nametables to $00
    let ntStartAddress = 0x2000;
    for (let i = ntStartAddress; i < 0x3f00; i++) {
      this._ppuMemory.set(i, 0x00);
    }
  }

  public run(cpuCycles: number) {
    /**
     * The general approach to this run loop is to simulate both the CPU, PPU and APU
     * all running at the same time. Each piece of hardware will run for the necessary amount of
     * cycles.
     */
    while (this._cycles <= cpuCycles) {
      const beginCpuCycles = this._cpu.getCurrentCycles();

      // If we are entering in VBLANK, Enter NMI handling routine!
      this._nmiTriggered = this._ppu.cpuNmiRequested();
      if (this._nmiTriggered) {
        this._cpu.setupNmi();
      }

      const opCode = this._memory.get(this._cpu.getPC());
      this._cpu.handleOp(opCode);

      const cpuCyclesRan = this._cpu.getCurrentCycles() - beginCpuCycles;

      // Run the PPU for the appropriate amount of cycles.
      let ppuCyclesToRun = cpuCyclesRan * 3;
      while (ppuCyclesToRun > 0) {
        this._ppu.run();
        ppuCyclesToRun--;
      }

      this._cycles += cpuCyclesRan;
    }

    this._cycles = 0;
  }

  private _initialize() {
    this.loadRom();
    this._cpu.powerUp();
    this._cpu.debugMode(true);
  }
}

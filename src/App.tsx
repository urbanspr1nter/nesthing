import React, { Component } from "react";
import { Nes, CpuRegisters, PpuRegisters } from "./nes/nes";
import "bulma/css/bulma.css";
import { ColorComponent } from "./nes/framebuffer";
import MainTitle from "./components/MainTitle";
import CpuRegisterView from "./components/CpuRegisterView";
import { buildRgbString } from "./nes/utils";
import PpuRegisterView from "./components/PpuRegisterView";

interface NesState {
  cycles: number;
  cpuMemory: number[];
  cpuRegisters: CpuRegisters;
  ppuRegisters: PpuRegisters;
  ppuMemory: number[];
  totalRunCycles: number;
  isRunning: boolean;
  nmiIrq: boolean;
  scanline: number;
  ppuCycles: number;
  cpuCycles: number;
}

class App extends Component<{}, NesState> {
  private _nes: Nes;
  private _canvas: HTMLCanvasElement | null;
  private _runInterval: NodeJS.Timeout;
  private _screenInterval: NodeJS.Timeout;

  constructor(props: any) {
    super(props);

    this._nes = new Nes();
    this._canvas = null;
    this.state = {
      cycles: 29833,
      cpuMemory: this._nes.cpuMemory(),
      cpuRegisters: this._nes.cpuRegisters(),
      ppuRegisters: this._nes.ppuRegisers(),
      ppuMemory: this._nes.ppuMemory(),
      totalRunCycles: 0,
      isRunning: false,
      nmiIrq: false,
      scanline: this._nes.scanlines(),
      ppuCycles: this._nes.ppuCycles(),
      cpuCycles: this._nes.cpuTotalCycles()
    };
  }

  componentDidMount = () => {
    this._canvas = document.getElementById("canvas") as HTMLCanvasElement;

    this._canvas.getContext("2d").fillStyle = "rgb(0, 0, 192)";
    this._canvas.getContext("2d").fillRect(0, 0, 256, 240);
  };

  processFrame = (
    ctx: CanvasRenderingContext2D,
    frameBuffer: ColorComponent[][]
  ) => {
    for (let i = 0; i < 240; i++) {
      for (let j = 0; j < 256; j++) {
        if (!frameBuffer[i][j]) {
          break;
        }
        ctx.strokeStyle = buildRgbString(frameBuffer[i][j]);

        ctx.beginPath();
        ctx.moveTo(j, i);
        ctx.lineTo(j + 1, i + 1);
        ctx.stroke();
        ctx.closePath();
      }
    }
  };

  runCycles = (e: React.SyntheticEvent) => {
    const renderFrame = () => {
      const frameBuffer = this._nes.frameBuffer();
      const ctx = this._canvas.getContext("2d");

      let start = performance.now();
      this._nes.run(29833);
      console.log(`1. EXEC TIME TIME - ${performance.now() - start}`);
      start = performance.now();
      this.processFrame(ctx, frameBuffer);
      console.log(`2. RENDER TIME - ${performance.now() - start}`);
    };

    const run = () => {
      setTimeout(() => {
        requestAnimationFrame(renderFrame);
        run();

        this.setState({
          cpuRegisters: this._nes.cpuRegisters(),
          ppuRegisters: this._nes.ppuRegisers(),
          cpuMemory: this._nes.cpuMemory(),
          ppuMemory: this._nes.ppuMemory(),
          isRunning: true,
          nmiIrq: this._nes.cpuNmiRequested(),
          scanline: this._nes.scanlines(),
          ppuCycles: this._nes.ppuCycles(),
          cpuCycles: this._nes.cpuTotalCycles()
        });
      }, 16);
    };

    run();
  };

  handlePause = () => {
    this.setState({ isRunning: false });
    clearInterval(this._runInterval);
    this._runInterval = undefined;
  };

  setCycles = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    this.setState({
      cycles: parseInt(target.value)
    });
  };

  onNotesChanged = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;

    localStorage.setItem("nesthing.notes", target.value);
  };

  render = () => {
    return (
      <div id="App" className="container">
        <MainTitle />
        <div className={"container"} id="screen">
          <div className="columns">
            <div className="column">
              <canvas
                id="canvas"
                width={256}
                height={240}
                style={{ border: "1px solid rgb(200, 200, 200)" }}
              />
              <div className="field is-horizontal">
                <div className="field-label is-small">
                  <label className="label">Cycle Stepping</label>
                </div>
                <div className="field-body">
                  <div className="field">
                    <input
                      type="text"
                      onChange={this.setCycles}
                      value={this.state.cycles}
                    />
                  </div>
                  <div className="field">
                    <button
                      className={`button is-primary is-normal ${
                        this.state.isRunning ? "is-loading" : undefined
                      }`}
                      type="button"
                      onClick={this.runCycles}
                    >
                      Run
                    </button>
                  </div>
                  <div className="field">
                    <button
                      className="button is-light is-normal"
                      type="button"
                      onClick={this.handlePause}
                    >
                      Pause
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <CpuRegisterView data={this.state.cpuRegisters} />
              </div>
              <div>
                <PpuRegisterView data={this.state.ppuRegisters} />
              </div>
              <div className="columns">
                <div className="column">
                  <span
                    className={`tag ${
                      this.state.nmiIrq ? "is-warning" : "is-light"
                    }`}
                  >
                    NMI
                  </span>
                </div>
                <div className="column">Scanline: {this.state.scanline}</div>
                <div className="column">PPU Cycles: {this.state.ppuCycles}</div>
              </div>
              <div className="columns">
                <div className="column">CPU Cycles: {this.state.cpuCycles}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
}

export default App;

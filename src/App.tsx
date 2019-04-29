import React, { Component } from "react";
import { Nes, CpuRegisters } from "./nes/nes";
import "bulma/css/bulma.css";
import { ColorComponent } from "./nes/common/interface";
import FrameBufferView from "./components/FrameBufferView";
import MainTitle from "./components/MainTitle";
import CpuMemoryView from "./components/CpuMemoryView";
import PpuMemoryView from "./components/PpuMemoryView";
import CpuRegisterView from "./components/CpuRegisterView";
import { buildRgbString } from "./utils/ui/utils";

interface NesState {
  cycles: number;
  cpuMemory: number[];
  cpuRegisters: CpuRegisters;
  ppuMemory: number[];
  frameBuffer: ColorComponent[][];
  totalRunCycles: number;
}

class App extends Component<{}, NesState> {
  private _nes: Nes;
  private _canvas: HTMLCanvasElement | null;

  constructor(props: any) {
    super(props);

    this._nes = new Nes();
    this._canvas = null;
    this.state = {
      cycles: 1000000,
      cpuMemory: this._nes.cpuMemory(),
      cpuRegisters: this._nes.cpuRegisters(),
      ppuMemory: this._nes.ppuMemory(),
      frameBuffer: this._nes.frameBuffer(),
      totalRunCycles: 0
    };
  }

  componentDidMount = () => {
    this._canvas = document.getElementById("canvas") as HTMLCanvasElement;

    this._canvas.getContext("2d").fillStyle = "rgb(0, 0, 192)";
    this._canvas.getContext("2d").fillRect(0, 0, 256, 240);
  };

  runCycles = (e: React.SyntheticEvent) => {
    const cycles = this.state.cycles;

    setInterval(() => {
      this._nes.run(cycles);

      const ctx = this._canvas.getContext("2d");

      this.setState(
        {
          cpuRegisters: this._nes.cpuRegisters(),
          cpuMemory: this._nes.cpuMemory(),
          ppuMemory: this._nes.ppuMemory(),
          frameBuffer: this._nes.frameBuffer()
        },
        () => {
          for (let i = 0; i < 240; i++) {
            for (let j = 0; j < 256; j++) {
              if (!this.state.frameBuffer[i][j]) {
                break;
              }
              ctx.strokeStyle = buildRgbString(this.state.frameBuffer[i][j]);

              ctx.beginPath();
              ctx.moveTo(j, i);
              ctx.lineTo(j + 1, i + 1);
              ctx.stroke();
              ctx.closePath();
            }
          }
        }
      );
    }, 500);
  };

  setCycles = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    this.setState(
      {
        cycles: parseInt(target.value)
      },
      () => console.log(target.value)
    );
  };

  render = () => {
    return (
      <div id="App" className="container">
        <MainTitle />
        <div className={"container"} id="screen">
          <div className="columns">
            <div className="column">
              <FrameBufferView data={this.state.frameBuffer} />
            </div>
            <div className="column">
              <canvas
                id="canvas"
                width={256}
                height={240}
                style={{ border: "1px solid rgb(200, 200, 200)" }}
              />
              <div>
                <input
                  type="text"
                  onChange={this.setCycles}
                  value={this.state.cycles}
                />
                <button type="button" onClick={this.runCycles}>
                  Run
                </button>
                <div>
                  <CpuRegisterView data={this.state.cpuRegisters} />
                </div>
              </div>
            </div>
            <div className="column">
              <CpuMemoryView data={this.state.cpuMemory} />
              <PpuMemoryView data={this.state.ppuMemory} />
            </div>
          </div>
        </div>
      </div>
    );
  };
}

export default App;

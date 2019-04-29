import React, { Component } from "react";
import { Nes, CpuRegisters } from "./nes/nes";
import "bulma/css/bulma.css";
import { prettifyMemory } from "./utils/ui/utils";
import { ColorComponent } from "./ppu/ppu";
import FrameBufferView from "./components/FrameBufferView";
import MainTitle from "./components/MainTitle";
import CpuMemoryView from "./components/CpuMemoryView";
import PpuMemoryView from "./components/PpuMemoryView";
import CpuRegisterView from "./components/CpuRegisterView";

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

  constructor(props: any) {
    super(props);

    this._nes = new Nes();

    this.state = {
      cycles: 1000000,
      cpuMemory: this._nes.cpuMemory(),
      cpuRegisters: this._nes.cpuRegisters(),
      ppuMemory: this._nes.ppuMemory(),
      frameBuffer: this._nes.frameBuffer(),
      totalRunCycles: 0
    };
  }

  componentDidMount() {}

  runCycles = (e: React.SyntheticEvent) => {
    const cycles = this.state.cycles;

    setInterval(() => {
      this._nes.run(cycles);

      const ctx = (document.getElementById(
        "canvas"
      ) as HTMLCanvasElement).getContext("2d");

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
              let r = this.state.frameBuffer[i][j].r;
              let g = this.state.frameBuffer[i][j].g;
              let b = this.state.frameBuffer[i][j].b;
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b})`;

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

  printFrameBuffer = () => {
    const data = this.state.frameBuffer;

    const comps = [];
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        comps.push(
          <div>{`(${i}, ${j}) - ${JSON.stringify(data[i][j])})`}</div>
        );
      }
    }

    return comps;
  };

  fillCpuMemory = () => {
    const data = prettifyMemory(this.state.cpuMemory);

    const addressValues = [];
    for (let i = 0; i < data.length; i++) {
      if (i % 0x10 === 0) {
        let label = i.toString(16).toUpperCase();
        let padding = 4 - label.length;
        for (let j = 0; j < padding; j++) {
          label = "0" + label;
        }
        addressValues.push(<br />);
        addressValues.push(
          <span style={{ fontSize: "small" }}>
            <strong>{label + " "}</strong>
          </span>
        );
      }

      addressValues.push(
        <span style={{ fontSize: "small" }}>{`${data[i]} `}</span>
      );
    }

    return addressValues;
  };

  fillPpuMemory = () => {
    const data = prettifyMemory(this.state.ppuMemory);

    const addressValues = [];
    for (let i = 0; i < data.length; i++) {
      if (i % 0x10 === 0) {
        let label = i.toString(16).toUpperCase();
        let padding = 4 - label.length;
        for (let j = 0; j < padding; j++) {
          label = "0" + label;
        }
        addressValues.push(<br />);
        addressValues.push(
          <span style={{ fontSize: "small" }}>
            <strong>{label + " "}</strong>
          </span>
        );
      }

      addressValues.push(
        <span style={{ fontSize: "small" }}>{`${data[i]} `}</span>
      );
    }

    return addressValues;
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
      <div id="App" className="App container">
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
                style={{ border: "1px solid black" }}
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

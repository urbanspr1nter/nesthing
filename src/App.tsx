import React, { Component } from 'react';
import './App.css';
import * as PIXI from 'pixi.js'
import { Nes } from './nes/nes';

interface NesState {
  cycles: number;
}

class App extends Component<{}, NesState> {
  private _pixi: PIXI.Application;
  private _nes: Nes;

  constructor(props: any) {
    super(props);

    this._pixi = new PIXI.Application({
      resolution: 2,
      width: 256,
      height: 240
    });
    this._nes = new Nes();

    this.state = {
      cycles: 1000000
    };
  }

  componentDidMount() {
    if(document !== null) {
      document.getElementById("screen").appendChild(this._pixi.view);
    }
  }

  runCycles = (e: React.SyntheticEvent) => {
    const cycles = this.state.cycles;    
    this._nes = new Nes();
    this._nes.run(cycles);

    const fb = this._nes.frameBuffer();
    const map = new PIXI.Graphics();
    this._pixi.renderer.clear();
    this._pixi.stage.addChild(map);

    map.position.set(0, 0);
    for(let i = 0; i < 240; i++) {
        for(let j = 0; j < 256; j++) {
            if(fb[i][j]) {
              map.lineStyle(1, 0x0000FF, 1).moveTo(j, i).lineTo(j+1, i);
            } else {
              map.lineStyle(1, 0x000000, 1).moveTo(j, i).lineTo(j+1, i);
            }
        }
    }
  }

  setCycles = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    this.setState({
      cycles: parseInt(target.value)
    }, () => console.log(target.value));
  }

  render() {
    return (
      <div id="App" className="App">
        <p></p>
        <div id="screen"></div>
        <div>
          <input type="text" onChange={this.setCycles} value={this.state.cycles}></input>
          <button type="button" onClick={this.runCycles}>Run</button>
        </div>
      </div>
    );
  }
}

export default App;

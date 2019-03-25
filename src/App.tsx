import React, { Component } from 'react';
import './App.css';
import * as PIXI from 'pixi.js'

class App extends Component {
  private _pixi: PIXI.Application;

  constructor(props: any) {
    super(props);

    this._pixi = new PIXI.Application();
  }

  componentDidMount() {
    if(document !== null) {
      document.getElementById("App").appendChild(this._pixi.view);
    }
  }

  render() {
    return (
      <div id="App" className="App"></div>
    );
  }
}

export default App;

import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./web/components/App";

// @ts-ignore
const WasmModule = Module;

// Run bootstrap code
checkModule();

function init() {
  ReactDOM.render(React.createElement(App, {wasmModule: WasmModule}), document.getElementById("app"));

  document.getElementById("overlay").className = "hidden";
}

function checkModule() {
  if (WasmModule._pf_test) {
    init();
    console.log("Initialized!");
  } else {
    console.log("Waiting to initialize...");
    setTimeout(checkModule, 250);
  }
}

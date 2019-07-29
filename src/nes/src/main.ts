import * as React from "react";
import * as ReactDOM from "react-dom";
import { MainTitle } from "./web/components/Title";
import { Footer } from "./web/components/Footer";
import { ButtonMappingInfo } from "./web/components/ButtonMappingInfo";
import {
  ReadyState,
  uiGameOptions,
} from "./constants";
import NesConsoleUi from "./web/components/NesConsoleUi";

// @ts-ignore
const WasmModule = Module;

// Run bootstrap code
checkModule();

function init() {
  ReactDOM.render(
    React.createElement(MainTitle, {
      title: "NesThing",
      subtitle:
        "For this demo, a few games are supported. Choose one from the list and press \"Play\"."
    }),
    document.getElementById("main-title-container")
  );
  ReactDOM.render(
    React.createElement(Footer),
    document.getElementById("footer-container")
  );
  ReactDOM.render(
    React.createElement(ButtonMappingInfo),
    document.getElementById("button-mapping-info")
  );

  ReactDOM.render(
    React.createElement(NesConsoleUi, {
      options: uiGameOptions,
      wasmModule: WasmModule
    }),
    document.getElementById("nes-console-container")
  )

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

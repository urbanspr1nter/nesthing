import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./web/components/App";
import NetPlay from "./netplay";

// @ts-ignore
const WasmModule = Module;

// Run bootstrap code
checkModule();


function init() {
  const netplay = new NetPlay();

  ReactDOM.render(
    React.createElement(App, { wasmModule: WasmModule, netplay: netplay }),
    document.getElementById("app")
  );

  document.getElementById("overlay").className = "hidden";

  document.getElementById("peer-id-connect").addEventListener("click", () => {
    const peerId = (document.getElementById("peer-id") as HTMLInputElement)
      .value;

    const connection = netplay.connect(peerId);
    connection.on("open", function() {
      document.getElementById("peer-send").addEventListener("click", () => {
        netplay.ping();
      });
    });
  });
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

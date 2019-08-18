import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./web/components/App";
import io from "socket.io-client";

const SERVER_ENDPOINT = "http://localhost:3000";

const socket = io(SERVER_ENDPOINT);
socket.on("connect", () => {
  console.log("CONNECTED!");
  socket.on("pongy", () => {
    console.log("PONG!");
  });
  socket.emit("pingy", {data: "ping"});
});

// @ts-ignore
const WasmModule = Module;

// Run bootstrap code
checkModule();


function init() {



  ReactDOM.render(
    React.createElement(App, { wasmModule: WasmModule }),
    document.getElementById("app")
  );

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

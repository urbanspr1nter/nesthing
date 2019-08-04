import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./web/components/App";
import NetPlay from "./netplay";
import io from "socket.io-client";

const SERVER_ENDPOINT = "http://localhost:3000/";

const socket = io(SERVER_ENDPOINT);
// socket.connect();

// @ts-ignore
const WasmModule = Module;

// Run bootstrap code
checkModule();


function init() {
  const netplay = new NetPlay();

  socket.emit("ping", "ping", data => console.log(data));

  ReactDOM.render(
    React.createElement(App, { wasmModule: WasmModule, netplay: netplay }),
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

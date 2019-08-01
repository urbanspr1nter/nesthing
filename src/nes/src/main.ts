import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./web/components/App";
import Peer from "peerjs";
import * as uuid from "uuid/v4";

// @ts-ignore
const WasmModule = Module;

// Run bootstrap code
checkModule();

const thisPeerId = uuid();
console.log("The peer ID is: ", thisPeerId);

const peer = new Peer(thisPeerId);
peer.on("open", function(id:string) {
  console.log("The peer ID is: ", id);
});
peer.on("connection", function(connection) {
  console.log(connection);
  connection.on("data", function(data) {
    console.log("Data received!", data);
  });
});

function init() {
  ReactDOM.render(React.createElement(App, {wasmModule: WasmModule}), document.getElementById("app"));

  document.getElementById("overlay").className = "hidden";



  document.getElementById("peer-id-connect").addEventListener("click", () => {
    const peerId = (document.getElementById("peer-id") as HTMLInputElement).value;

    console.log(peerId);

    var connection = peer.connect(peerId);
    connection.on("open", function() {
      document.getElementById("peer-send").addEventListener("click", () => {
        connection.send(`Random ${Math.random()} from ${thisPeerId}`);
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

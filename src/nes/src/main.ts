import { NesConsole } from "./nesconsole";
import RomManager, { Roms } from "./ui/rommanager";
import { ConsoleState } from "./nes";
import { EventEmitter } from "events";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { MainTitle } from "./web/components/Title";
import { Footer } from "./web/components/Footer";
import { ButtonMappingInfo } from "./web/components/ButtonMappingInfo";
import NesConsoleScreen from "./web/components/NesConsoleScreen";
import NesConsoleButtons from "./web/components/NesConsoleButtons";
import NesConsoleGameSelect from "./web/components/NesConsoleGameSelect";
import {
  ReadyState,
  NotificationType,
  uiGameOptions,
  DomCanvasId
} from "./constants";

// @ts-ignore
const WasmModule = Module;
const pako = require("pako");
const eventEmitter = new EventEmitter();

let gameConsole: NesConsole;

document.onreadystatechange = () => {
  if (document.readyState === ReadyState.Interactive) {
    const notificationContainer = document.getElementById(
      "notification-container"
    );
    notificationContainer.classList.add("hidden");

    document
      .getElementById("btn-dismiss-notification")
      .addEventListener("click", () => {
        const notificationContainer = document.getElementById(
          "notification-container"
        );
        notificationContainer.classList.add("hidden");
      });
  }
};

document.getElementById("save-file").addEventListener("change", () => {
  const files = (document.getElementById("save-file") as HTMLInputElement)
    .files;
  if (files.length === 0) {
    return;
  }

  const file = files[0];

  document.getElementById("file-name").innerHTML = file.name;
});

document.getElementById("btn-load").addEventListener("click", () => {
  if (!gameConsole) {
    setNotification("Start a game!", NotificationType.Danger);
    return;
  }
  const files = (document.getElementById("save-file") as HTMLInputElement)
    .files;
  if (files.length === 0) {
    return;
  }

  const file = files[0];
  const reader = new FileReader();
  reader.onload = (function readFile(currentFile, gameConsole: NesConsole) {
    return function(e) {
      const jsonString = pako.inflate(e.target.result, { to: "string" });
      const data: ConsoleState = JSON.parse(jsonString);

      if (data.currentRom !== gameConsole.nes.rom) {
        setNotification("Game doesn't match!", NotificationType.Danger);
        return;
      }

      gameConsole.load(data);
    };
  })(file, gameConsole);

  reader.readAsText(file);
});

document.getElementById("btn-save").addEventListener("click", () => {
  const data = gameConsole.save();

  setNotification("Saved state!", NotificationType.Information);

  saveData(
    data,
    `${Roms[gameConsole.nes.rom]}-save-state-${new Date(
      Date.now()
    ).toISOString()}.dat`
  );
});

// Run bootstrap code
checkModule();

function onPlayClick() {
  eventEmitter.emit("stop");
  eventEmitter.removeAllListeners("stop");

  const selectElement = document.getElementById(
    "select-game"
  ) as HTMLSelectElement;
  const selectedGame = Number(
    selectElement.options[selectElement.selectedIndex].value
  );

  const game = RomManager.valueToGame(selectedGame);

  gameConsole = new NesConsole(game, DomCanvasId, eventEmitter, WasmModule);
  gameConsole.setupDOM();

  setTimeout(function() {
    setImmediate(() => gameConsole.run(performance.now()));
  }, 1000);
}

function onResetClick() {
  if (!gameConsole) {
    return;
  }
  gameConsole.nes.reset();
}

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
    React.createElement(NesConsoleScreen),
    document.getElementById("nes-console-screen")
  );
  ReactDOM.render(
    React.createElement(NesConsoleGameSelect, {
      options: uiGameOptions
    }),
    document.getElementById("nes-console-game-select-container")
  );
  ReactDOM.render(
    React.createElement(NesConsoleButtons, {
      onPlayClick: onPlayClick.bind(this),
      onResetClick: onResetClick.bind(this)
    }),
    document.getElementById("nes-console-buttons-container")
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

function setNotification(message: string, type: NotificationType) {
  const notificationMessage = document.getElementById("notification-message");
  notificationMessage.innerHTML = message;

  const notificationContainer = document.getElementById(
    "notification-container"
  );
  notificationContainer.classList.remove("hidden");
  notificationContainer.classList.add(type);
}

function saveData(data, filename) {
  if (!data) {
    setNotification("No data to save.", NotificationType.Danger);
    return;
  }

  if (!filename) {
    filename = `${Roms[gameConsole.nes.rom]}-save-state-${new Date(
      Date.now()
    ).toISOString()}.dat`;
  }

  const compressedData = pako.deflate(data, { to: "string" });
  const blob = new Blob([compressedData]);
  const e = document.createEvent("MouseEvents");
  const a = document.createElement("a");

  a.download = filename;
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl = ["text/plain", a.download, a.href].join(":");
  e.initMouseEvent(
    "click",
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null
  );
  a.dispatchEvent(e);
}

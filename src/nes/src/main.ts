import { NesConsole } from "./nesconsole";
import RomManager, { Roms } from "./ui/rommanager";
import { ConsoleState } from "./nes";
import { EventEmitter } from "events";

// @ts-ignore
const WasmModule = Module;

const pako = require("pako");
const canvasId = "main";
const eventEmitter = new EventEmitter();
// https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState
const ReadyState = {
  Loading: "loading",
  Interactive: "interactive",
  Complete: "complete"
};
enum NotificationType {
  Danger = "is-danger",
  Information = "is-info"
}

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

    document.getElementById("btn-reset").addEventListener("click", () => {
      gameConsole.nes.reset();
    });
  }
};

document.getElementById("save-file").addEventListener("change", () => {
  var files = (document.getElementById("save-file") as HTMLInputElement).files;
  if (files.length === 0) {
    return;
  }

  var file = files[0];

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

function init() {
  const pf = WasmModule;

  document.getElementById("btn-play").addEventListener("click", () => {
    eventEmitter.emit("stop");
    eventEmitter.removeAllListeners("stop");

    var selectElement = document.getElementById(
      "select-game"
    ) as HTMLSelectElement;
    var selectedGame = Number(
      selectElement.options[selectElement.selectedIndex].value
    );

    var game = RomManager.valueToGame(selectedGame);

    gameConsole = new NesConsole(game, canvasId, eventEmitter, pf);
    gameConsole.setupDOM();

    setTimeout(function() {
      setImmediate(() => gameConsole.run(performance.now()));
    }, 1000);
  });

  document.getElementById("overlay").className = "hidden";
}

function checkModule() {
  if(WasmModule._pf_test) {
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

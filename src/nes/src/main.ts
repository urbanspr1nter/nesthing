import { NesConsole } from "./nesconsole";
import RomManager, { Roms } from "./ui/rommanager";
import { ConsoleState } from "./nes";
import { EventEmitter } from "events";

const pako = require("pako");
const canvasId = "main";
const eventEmitter = new EventEmitter();

var gameConsole: NesConsole;
var timeoutHandle = undefined;

document.getElementById("btn-play").addEventListener("click", () => {
  eventEmitter.emit("stop");
  eventEmitter.removeAllListeners("stop");

  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }

  var selectElement = document.getElementById(
    "select-game"
  ) as HTMLSelectElement;
  var selectedGame = Number(
    selectElement.options[selectElement.selectedIndex].value
  );

  var game = RomManager.valueToGame(selectedGame);

  gameConsole = new NesConsole(game, canvasId, eventEmitter);
  gameConsole.setupDOM();

  timeoutHandle = setTimeout(function() {
    setImmediate(() => gameConsole.run(performance.now()));
  }, 1000);
});

document.getElementById("btn-reset").addEventListener("click", () => {
  gameConsole.nes.reset();
});

document.getElementById("btn-save").addEventListener("click", () => {
  var data = gameConsole.save();

  document.getElementById("saved-status").innerHTML =
    "<strong>State Saved!</strong>";

  saveData(
    data,
    `${Roms[gameConsole.nes.rom]}-save-state-${new Date(
      Date.now()
    ).toISOString()}.dat`
  );
});

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
    alert("Start a game!");
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
        alert("Game doesn't match!");
        return;
      }

      gameConsole.load(data);
    };
  })(file, gameConsole);

  reader.readAsText(file);
});

document.getElementById("overlay").className = "hidden";

/* function to save JSON to file from browser
 * adapted from http://bgrins.github.io/devtools-snippets/#console-save
 * @param {Object} data -- json object to save
 * @param {String} file -- file name to save to
 */
function saveData(data, filename) {
  if (!data) {
    console.error("No data");
    return;
  }

  if (!filename)
    filename = `${Roms[gameConsole.nes.rom]}-save-state-${new Date(
      Date.now()
    ).toISOString()}.dat`;

  var d = pako.deflate(data, { to: "string" });
  var blob = new Blob([d]);
  var e = document.createEvent("MouseEvents");
  var a = document.createElement("a");

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

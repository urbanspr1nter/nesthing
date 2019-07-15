import { NesConsole } from "./nesconsole";
import RomManager from "./ui/rommanager";

var canvasId = "main";
var gameConsole: NesConsole;
var timeoutHandle = undefined;

document.getElementById("btn-play").addEventListener("click", () => {
  if(timeoutHandle) {
    clearTimeout(timeoutHandle);
  }

  var selectElement = document.getElementById(
    "select-game"
  ) as HTMLSelectElement;
  var selectedGame = Number(
    selectElement.options[selectElement.selectedIndex].value
  );

  var game = RomManager.valueToGame(selectedGame);
  gameConsole = new NesConsole(game, canvasId);
  gameConsole.setupDOM();

  timeoutHandle = setTimeout(function() {
    setImmediate(() => gameConsole.run(performance.now()));
  }, 1000);
});

document.getElementById("overlay").className = "hidden";
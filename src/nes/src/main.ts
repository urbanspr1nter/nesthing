import { NesConsole } from "./nesconsole";
import RomManager from "./ui/rommanager";

var canvasId = "main";
var gameConsole: NesConsole;

document.getElementById("btn-play").addEventListener("click", () => {
  const selectElement = document.getElementById(
    "select-game"
  ) as HTMLSelectElement;
  const selectedGame = Number(
    selectElement.options[selectElement.selectedIndex].value
  );

  var game = RomManager.valueToGame(selectedGame);
  gameConsole = new NesConsole(game, canvasId);
  gameConsole.setupDOM();

  setTimeout(function() {
    requestAnimationFrame(t => gameConsole.run(t));
  }, 1000);
});

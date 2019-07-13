import { NesConsole } from "./nesconsole";
import { Roms } from "./nes";

var canvasId = "main";
var gameConsole: NesConsole;

document.getElementById("btn-play").addEventListener("click", () => {
  const selectElement = (document.getElementById("select-game") as HTMLSelectElement);
  const selectedGame = Number(selectElement.options[selectElement.selectedIndex].value);

  var game = undefined;
  switch (selectedGame) {
    case 0:
      game = Roms.MarioBros;
      break;
    case 1:
      game = Roms.DonkeyKong;
      break;
    case 2:
      game = Roms.SpaceInvaders;
      break;
    case 3: 
      game = Roms.F1Race;
      break;
    case 4:
      game = Roms.Tetris;
      break;
    case 5:
      game = Roms.SuperMarioBros;
      break;
    case 6:
      game = Roms.LegendOfZelda;
      break;
    case 7:
      game = Roms.MegaMan;
      break;
    case 8:
      game = Roms.FinalFantasy;
      break;
  }

  gameConsole = new NesConsole(game, canvasId);
  gameConsole.setupDOM();

  setTimeout(function() {
    requestAnimationFrame((t) => gameConsole.run(t));
  }, 1000);
});

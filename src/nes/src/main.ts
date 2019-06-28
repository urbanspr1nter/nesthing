import { Nes, Roms, NesOptions } from "./nes";
import { UiFrameBuffer } from "./ui/ui.framebuffer";
import { UiKeyHandler } from "./ui/ui.keyhandler";
import { Controller } from "./controller";

class NesConsole {
  private _nes: Nes;
  private _options: NesOptions;

  constructor(rom: Roms) {
    const playerOneController = new Controller();
    const playerTwoController = new Controller();

    this._options = {
      keyHandler: new UiKeyHandler(playerOneController, playerTwoController),
      frameRenderer: new UiFrameBuffer(),
      controller: {
        one: playerOneController,
        two: playerTwoController
      },
      rom
    };

    this._nes = new Nes(this._options);
  }

  get nes() {
    return this._nes;
  }

  get uiKeyHandler() {
    return this._options.keyHandler;
  }

  get uiFrameBuffer() {
    return this._options.frameRenderer;
  }

  public setupDOM() {
    document.getElementById("btn-scale-1").addEventListener("click", () => {
      this._options.frameRenderer.scale(1);
    });
    document.getElementById("btn-scale-2").addEventListener("click", () => {
      this._options.frameRenderer.scale(2);
    });
    document.getElementById("btn-scale-3").addEventListener("click", () => {
      this._options.frameRenderer.scale(3);
    });
    document.getElementById("btn-scale-4").addEventListener("click", () => {
      this._options.frameRenderer.scale(4);
    });

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerOneKeyDown(e.key);
    });
    document.addEventListener("keyup", (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerOneKeyUp(e.key);
    });
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerTwoKeyDown(e.key);
    });
    document.addEventListener("keyup", (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerTwoKeyUp(e.key);
    });
  }
}

let gameConsole: NesConsole;
document.getElementById("btn-play").addEventListener("click", () => {
  const selectElement = (document.getElementById("select-game") as HTMLSelectElement);
  const selectedGame = Number(selectElement.options[selectElement.selectedIndex].value);

  var game;
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
  }

  gameConsole = new NesConsole(game);
  gameConsole.setupDOM();

  setTimeout(function () {
    triggerRun();
  }, 1000);
});

function triggerRun() {
  requestAnimationFrame(triggerRun);

  if(gameConsole.nes.readyToRender) {
    gameConsole.nes.readyToRender = false;
  }

  while(!gameConsole.nes.readyToRender) {
    gameConsole.nes.run();
  }
}



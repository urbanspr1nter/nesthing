import { Nes, Roms } from "./nes";
import { UiKeyHandler } from "./ui/ui.keyhandler";
import { EventEmitter } from "events";
import { UiFrameBuffer } from "./ui/ui.framebuffer";

interface NesOptions {
  keyHandler: UiKeyHandler;
  frameRenderer: UiFrameBuffer;
  rom: Roms;
};

class NesConsole {
  private _nes: Nes;
  private _options: NesOptions;

  constructor(rom: Roms) {
    this._nes = new Nes(new EventEmitter, rom);

    this._options = {
      keyHandler: new UiKeyHandler(this._nes.controller1),
      frameRenderer: new UiFrameBuffer(this._nes),
      rom
    };
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

  document.getElementById("btn-scale-2").click();

  setTimeout(function () {
    triggerRun(gameConsole.uiFrameBuffer);
  }, 1000);
});

var msPerFrame = 16;
var frameTime = 0;
function triggerRun(uiFrameBuffer) {
  var startTime = performance.now();
  setImmediate(() => {
    gameConsole.nes.run();
    frameTime += (performance.now() - startTime);

    if (gameConsole.nes.readyToRender) {
      if (frameTime >= msPerFrame) {
        requestAnimationFrame(uiFrameBuffer.drawFrame.bind(uiFrameBuffer));

        document.getElementById("fps").innerHTML = `Frame rendered in: ${frameTime} ms`;
        frameTime = 0;
        gameConsole.nes.setReadyToRender(false);

        triggerRun(uiFrameBuffer);
      } else {
        setTimeout(function () { triggerRun(uiFrameBuffer); }, msPerFrame - frameTime);
        frameTime = 0;
      }
    } else {
      triggerRun(uiFrameBuffer);
    }
  });
}



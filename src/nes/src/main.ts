import { EventEmitter } from "events";

import { Nes, Roms } from "./nes";

import { UiFrameBuffer } from "./ui/ui.framebuffer";
import { UiKeyHandler } from "./ui/ui.keyhandler";

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
    triggerRun(performance.now(), gameConsole.uiFrameBuffer);
  }, 1000);
});

var msPerFrame = 1000 / 16;
var frameTime = 0;
var lastFrameTime = 0;
function triggerRun(time, uiFrameBuffer) {
  if(!!lastFrameTime) {
    lastFrameTime = time;
  }

  frameTime += (time - lastFrameTime);
  lastFrameTime = time;

  while(lastFrameTime >= msPerFrame) {
    while(true) {
      gameConsole.nes.run();

      if(gameConsole.nes.readyToRender) {
        uiFrameBuffer.drawFrame();
        gameConsole.nes.setReadyToRender(false);
        break;
      }
    }
    frameTime -= msPerFrame;
    break;
  }

  requestAnimationFrame((t) => triggerRun(t, uiFrameBuffer));
}



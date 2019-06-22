import { Nes, Roms } from "./nes";
import { UiKeyHandler } from "./ui/ui.keyhandler";
import { EventEmitter } from "events";
import { UiFrameBuffer } from "./ui/ui.framebuffer";

interface NesOptions {
  keyHandler: UiKeyHandler;
  frameRenderer: UiFrameBuffer;
};

let nesEventListener = new EventEmitter();
let nes: Nes;

function setupDOM(options: NesOptions) {
  document.getElementById("btn-scale-1").addEventListener("click", () => {
    options.frameRenderer.scale(1);
  });
  document.getElementById("btn-scale-2").addEventListener("click", () => {
    options.frameRenderer.scale(2);
  });
  document.getElementById("btn-scale-3").addEventListener("click", () => {
    options.frameRenderer.scale(3);
  });
  document.getElementById("btn-scale-4").addEventListener("click", () => {
    options.frameRenderer.scale(4);
  });

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    options.keyHandler.handlePlayerOneKeyDown(e.key);
  });
  document.addEventListener("keyup", (e: KeyboardEvent) => {
    options.keyHandler.handlePlayerOneKeyUp(e.key);
  });
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    options.keyHandler.handlePlayerTwoKeyDown(e.key);
  });
  document.addEventListener("keyup", (e: KeyboardEvent) => {
    options.keyHandler.handlePlayerTwoKeyUp(e.key);
  });

}

function run() {
  setImmediate(function () {
    nes.run();
    run();
  });
}

let frames = 0;
let currentStartTime = performance.now();
document.getElementById("btn-play").addEventListener("click", () => {
  const selectElement = (document.getElementById("select-game") as HTMLSelectElement);
  const selectedGame = Number(selectElement.options[selectElement.selectedIndex].value);

  let game;
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

  nes = new Nes(nesEventListener, game);

  const uiFrameBuffer = new UiFrameBuffer(nes);
  const uiKeyHandler = new UiKeyHandler(nes.controller1);

  const options: NesOptions = {
    keyHandler: uiKeyHandler,
    frameRenderer: uiFrameBuffer
  }

  setupDOM(options);
  document.getElementById("btn-scale-2").click();

  nesEventListener.on("renderFrame", () => {
    requestAnimationFrame(() => {
      frames++;
      uiFrameBuffer.drawFrame();
      if (performance.now() - currentStartTime >= 1000) {
        document.getElementById("fps").innerHTML = `${frames} fps`;
        currentStartTime = performance.now();
        frames = 0;
      }
    });
  });

  setTimeout(run, 1000);
});

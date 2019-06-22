import { Nes, Roms } from "./nes";
import { UiKeyHandler } from "./ui.keyhandler";
import { EventEmitter } from "events";
import { UiFrameBuffer } from "./ui.framebuffer";

let nesEventListener = new EventEmitter();
let nes: Nes;

function setupDOM(nes: Nes, uiFrameBuffer: UiFrameBuffer) {
  document.getElementById("btn-scale-1").addEventListener("click", () => {
    uiFrameBuffer.scale(1);
  });
  document.getElementById("btn-scale-2").addEventListener("click", () => {
    uiFrameBuffer.scale(2);
  });
  document.getElementById("btn-scale-3").addEventListener("click", () => {
    uiFrameBuffer.scale(3);
  });
  document.getElementById("btn-scale-4").addEventListener("click", () => {
    uiFrameBuffer.scale(4);
  });
}

function run() {
  setImmediate(function () {
    nes.run(497);
    run();
  });
}

document.getElementById("btn-play").addEventListener("click", () => {

  const selectElement = (document.getElementById("select-game") as HTMLSelectElement);
  const selectedGame = Number(selectElement.options[selectElement.selectedIndex].value);

  const game = selectedGame === 0 ? Roms.MarioBros : Roms.DonkeyKong;

  nes = new Nes(nesEventListener, game);

  const uiFrameBuffer = new UiFrameBuffer(nes);
  const uiKeyHandler = new UiKeyHandler(nes.controller1);

  setupDOM(nes, uiFrameBuffer);

  nesEventListener.on("renderFrame", () => {
    requestAnimationFrame(() => {
      uiFrameBuffer.drawFrame();
    });
  });

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    uiKeyHandler.handlePlayerOneKeyDown(e.key);
  });

  document.addEventListener("keyup", (e: KeyboardEvent) => {
    uiKeyHandler.handlePlayerOneKeyUp(e.key);
  });

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    uiKeyHandler.handlePlayerTwoKeyDown(e.key);
  });

  document.addEventListener("keyup", (e: KeyboardEvent) => {
    uiKeyHandler.handlePlayerTwoKeyUp(e.key);
  });

  setTimeout(run, 1000);
});

document.getElementById("btn-scale-2").click();

import { Nes, Roms } from "./nes";
import { UiKeyHandler } from "./ui-key-handler";
import { EventEmitter } from "events";

const FPS = 60;
const TIME_PER_FRAME = Math.ceil(1000 / FPS);
const LOGICAL_SECOND_INTERVAL = TIME_PER_FRAME * FPS;
const WIDTH = 256;
const HEIGHT = 240;

const canvas = document.getElementById("main") as HTMLCanvasElement;
const context = canvas.getContext("2d", { alpha: false });
context.imageSmoothingEnabled = false;

let nesEventListener = new EventEmitter();
let nes: Nes;
let paused = false;
let consoleShown = false;

const prevBuffer = {
  buffer: [] as string[][]
};
clearPixelBuffer();

function scale(times: number) {
  canvas.width = times * WIDTH;
  canvas.height = times * HEIGHT;
  context.scale(times, times);

  clearPixelBuffer();
  drawFrame(nes.frameBuffer());
}

function setupDOM(nes: Nes) {
  document.getElementById("btn-scale-1").addEventListener("click", () => {
    scale(1);
  });
  document.getElementById("btn-scale-2").addEventListener("click", () => {
    scale(2);
  });
  document.getElementById("btn-scale-3").addEventListener("click", () => {
    scale(3);
  });
  document.getElementById("btn-scale-4").addEventListener("click", () => {
    scale(4);
  });
}

function clearPixelBuffer() {
  for (let i = 0; i < HEIGHT; i++) {
    if (prevBuffer.buffer[i]) {
      prevBuffer.buffer[i] = [];
    } else {
      prevBuffer.buffer.push([]);
    }
    for (let j = 0; j < WIDTH; j++) {
      prevBuffer.buffer[i].push("");
    }
  }
}

function drawFrame(frameBuffer: string[][]) {
  for (let i = 0; i < HEIGHT; i++) {
    for (let j = 0; j < WIDTH; j++) {
      if (prevBuffer.buffer[i][j] === frameBuffer[i][j]) {
        continue;
      }

      prevBuffer.buffer[i][j] = frameBuffer[i][j];
      context.fillStyle = prevBuffer.buffer[i][j];
      context.fillRect(j, i, 1, 1);
    }
  }
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

  nesEventListener.on("renderFrame", () => {
    requestAnimationFrame(() => {
      drawFrame(nes.frameBuffer());
    });
  });

  setupDOM(nes);

  const uiKeyHandler = new UiKeyHandler(nes.controller1);

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

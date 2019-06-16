// require('./nestest');

import { Nes } from "./nes";
import { UiKeyHandler } from "./ui-key-handler";

const FPS = 60;
const TIME_PER_FRAME = Math.ceil(1000 / FPS);
const LOGICAL_SECOND_INTERVAL = TIME_PER_FRAME * FPS;
const CPU_CYCLES_PER_FRAME = 29780;
const WIDTH = 256;
const HEIGHT = 240;

const canvas = document.getElementById("main") as HTMLCanvasElement;
const context = canvas.getContext("2d", { alpha: false });
context.imageSmoothingEnabled = false;

const nes = new Nes();
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
document.getElementById("btn-pause").addEventListener("click", () => {
  paused = !paused;
});
document.getElementById("btn-snap-nt").addEventListener("click", () => {
  const data = nes.snapNt();
  document.getElementById("txtarea-console").innerHTML = data;
});
document.getElementById("btn-dump-log").addEventListener("click", () => {
  const log = nes.log();
  document.getElementById("txtarea-console").innerHTML = log;
});
document.getElementById("chk-show-console").addEventListener("change", () => {
  if (consoleShown) {
    consoleShown = false;
    document.getElementById("txtarea-console").style.display = "none";
  } else {
    consoleShown = true;
    document.getElementById("txtarea-console").style.display = "initial";
  }
});

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

let totalCycles = 0;

function renderFrame() {
  if (paused) {
    return;
  }

  totalCycles += nes.run(497);

  if (totalCycles >= CPU_CYCLES_PER_FRAME) {
    totalCycles = 0;
    nes.clearTotalCycles();

    requestAnimationFrame(() => {
      drawFrame(nes.frameBuffer());
    });
  }
}

function run() {
  setImmediate(function() {
    renderFrame();
    run();
  });
}

document.getElementById("btn-play").addEventListener("click", () => {
  setTimeout(run, 1000);

});

document.getElementById("btn-scale-2").click();

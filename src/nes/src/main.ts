// require('./nestest');

import { Nes } from "./nes";
import { Buttons } from "./controller";

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

const prevBuffer = {
  buffer: [] as string[][]
};
clearPixelBuffer();

const keyMap = {
  Start: "Enter",
  Select: "Shift",
  A: "j",
  B: "k",
  Up: "w",
  Down: "s",
  Left: "a",
  Right: "d"
};

function scale(times: number) {
  canvas.width = times * WIDTH;
  canvas.height = times * HEIGHT;
  context.scale(times, times);

  clearPixelBuffer();
  drawFrame(nes.frameBuffer());
}

function getDefaultKeySettings(): { [id: number]: boolean } {
  const defaultMap: { [id: number]: boolean } = {
    [Buttons.A]: false,
    [Buttons.B]: false,
    [Buttons.Select]: false,
    [Buttons.Start]: false,
    [Buttons.Up]: false,
    [Buttons.Down]: false,
    [Buttons.Left]: false,
    [Buttons.Right]: false
  };

  return defaultMap;
}

const keyPressed: { [id: number]: boolean } = { ...getDefaultKeySettings() };

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

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === keyMap.Start) {
    keyPressed[Buttons.Start] = true;
  }
  if (e.key === keyMap.Select) {
    keyPressed[Buttons.Select] = true;
  }
  if (e.key === keyMap.A) {
    keyPressed[Buttons.A] = true;
  }
  if (e.key === keyMap.B) {
    keyPressed[Buttons.B] = true;
  }
  if (e.key === keyMap.Up) {
    keyPressed[Buttons.Up] = true;
  }
  if (e.key === keyMap.Down) {
    keyPressed[Buttons.Down] = true;
  }
  if (e.key === keyMap.Left) {
    keyPressed[Buttons.Left] = true;
  }
  if (e.key === keyMap.Right) {
    keyPressed[Buttons.Right] = true;
  }

  nes.controller1.setButtons(keyPressed);
});

document.addEventListener("keyup", (e: KeyboardEvent) => {
  if (e.key === keyMap.Start) {
    keyPressed[Buttons.Start] = false;
  }
  if (e.key === keyMap.Select) {
    keyPressed[Buttons.Select] = false;
  }
  if (e.key === keyMap.A) {
    keyPressed[Buttons.A] = false;
  }
  if (e.key === keyMap.B) {
    keyPressed[Buttons.B] = false;
  }
  if (e.key === keyMap.Up) {
    keyPressed[Buttons.Up] = false;
  }
  if (e.key === keyMap.Down) {
    keyPressed[Buttons.Down] = false;
  }
  if (e.key === keyMap.Left) {
    keyPressed[Buttons.Left] = false;
  }
  if (e.key === keyMap.Right) {
    keyPressed[Buttons.Right] = false;
  }

  nes.controller1.setButtons(keyPressed);
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

var currentFrames = 0;
let currentTimeDelta = 0;
let totalTime = 0;
let totalCycles = 0;

function renderFrame() {
  if(paused) {
    return;
  }

  const start = performance.now();

  totalCycles += nes.run(CPU_CYCLES_PER_FRAME);

  currentTimeDelta = performance.now() - start;
  if (totalCycles >= CPU_CYCLES_PER_FRAME) {
    totalCycles = 0;
    nes.clearTotalCycles();
    requestAnimationFrame(() => {
      drawFrame(nes.frameBuffer());
      currentFrames++;
    });
  }

  totalTime += currentTimeDelta;
  showFps();
}

function showFps() {
  if (totalTime >= LOGICAL_SECOND_INTERVAL) {
    document.getElementById("fps").innerHTML = `${currentFrames} fps`;
    currentFrames = 0;
    totalTime = 0;
  }
}

function run() {
  setImmediate(function() {
    renderFrame();
    run();
  });
}

setTimeout(run, 1000);

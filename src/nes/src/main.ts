import { Nes } from "./nes";
import { Buttons } from "./controller";

const FPS = 60;

const TIME_PER_FRAME = Math.ceil(1000 / FPS);
const LOGICAL_SECOND_INTERVAL = TIME_PER_FRAME * FPS;
const CPU_CYCLES_PER_FRAME = 29780;

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

const WIDTH = 256;
const HEIGHT = 240;

const canvas = document.getElementById("main") as HTMLCanvasElement;
const context = canvas.getContext("2d", { alpha: false });
context.imageSmoothingEnabled = false;

const nes = new Nes();

const prevBuffer = {
  buffer: [] as string[][]
};

for (let i = 0; i < HEIGHT; i++) {
  prevBuffer.buffer.push([]);
  for (let j = 0; j < WIDTH; j++) {
    prevBuffer.buffer[i].push("");
  }
}

function drawFrame(frameBuffer: string[][]) {
  for (let i = 0; i < HEIGHT; i++) {
    for (let j = 0; j < WIDTH; j++) {
      if (
        prevBuffer.buffer[i][j] &&
        prevBuffer.buffer[i][j] === frameBuffer[i][j]
      ) {
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
let frameTime = 0;
let totalCycles = 0;

function renderFrame() {
  const start = performance.now();

  totalCycles += nes.run(497);

  currentTimeDelta = performance.now() - start;
  if (frameTime >= TIME_PER_FRAME && totalCycles >= CPU_CYCLES_PER_FRAME) {
    totalCycles = 0;
    frameTime = 0;
    requestAnimationFrame(() => {
      drawFrame(nes.frameBuffer());
      currentFrames++;
    });
  }

  frameTime += currentTimeDelta;

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

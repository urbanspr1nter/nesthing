// require('./nestest');

import { Nes } from "./nes";
import { Buttons, ControllerPlayer } from "./controller";

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

const keyMapPlayer1 = {
  Start: "Enter",
  Select: "Shift",
  A: "j",
  B: "k",
  Up: "w",
  Down: "s",
  Left: "a",
  Right: "d"
};

const keyMapPlayer2 = {
  Start: "/",
  Select: ".",
  A: "m",
  B: ",",
  Up: "ArrowUp",
  Down: "ArrowDown",
  Left: "ArrowLeft",
  Right: "ArrowRight"
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

const keyPressedPlayer1: { [id: number]: boolean } = { ...getDefaultKeySettings() };
const keyPressedPlayer2: { [id: number]: boolean } = { ...getDefaultKeySettings() };


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
  if(consoleShown) {
    consoleShown = false;
    document.getElementById("txtarea-console").style.display = "none";
  } else {
    consoleShown = true;
    document.getElementById("txtarea-console").style.display = "initial";
  }
});

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === keyMapPlayer1.Start) {
    keyPressedPlayer1[Buttons.Start] = true;
  }
  if (e.key === keyMapPlayer1.Select) {
    keyPressedPlayer1[Buttons.Select] = true;
  }
  if (e.key === keyMapPlayer1.A) {
    keyPressedPlayer1[Buttons.A] = true;
  }
  if (e.key === keyMapPlayer1.B) {
    keyPressedPlayer1[Buttons.B] = true;
  }
  if (e.key === keyMapPlayer1.Up) {
    keyPressedPlayer1[Buttons.Up] = true;
  }
  if (e.key === keyMapPlayer1.Down) {
    keyPressedPlayer1[Buttons.Down] = true;
  }
  if (e.key === keyMapPlayer1.Left) {
    keyPressedPlayer1[Buttons.Left] = true;
  }
  if (e.key === keyMapPlayer1.Right) {
    keyPressedPlayer1[Buttons.Right] = true;
  }

  nes.controller1.setButtons(keyPressedPlayer1, ControllerPlayer.One);
});

document.addEventListener("keyup", (e: KeyboardEvent) => {
  if (e.key === keyMapPlayer1.Start) {
    keyPressedPlayer1[Buttons.Start] = false;
  }
  if (e.key === keyMapPlayer1.Select) {
    keyPressedPlayer1[Buttons.Select] = false;
  }
  if (e.key === keyMapPlayer1.A) {
    keyPressedPlayer1[Buttons.A] = false;
  }
  if (e.key === keyMapPlayer1.B) {
    keyPressedPlayer1[Buttons.B] = false;
  }
  if (e.key === keyMapPlayer1.Up) {
    keyPressedPlayer1[Buttons.Up] = false;
  }
  if (e.key === keyMapPlayer1.Down) {
    keyPressedPlayer1[Buttons.Down] = false;
  }
  if (e.key === keyMapPlayer1.Left) {
    keyPressedPlayer1[Buttons.Left] = false;
  }
  if (e.key === keyMapPlayer1.Right) {
    keyPressedPlayer1[Buttons.Right] = false;
  }

  nes.controller1.setButtons(keyPressedPlayer1, ControllerPlayer.One);
});

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === keyMapPlayer2.Start) {
    keyPressedPlayer2[Buttons.Start] = true;
  }
  if (e.key === keyMapPlayer2.Select) {
    keyPressedPlayer2[Buttons.Select] = true;
  }
  if (e.key === keyMapPlayer2.A) {
    keyPressedPlayer2[Buttons.A] = true;
  }
  if (e.key === keyMapPlayer2.B) {
    keyPressedPlayer2[Buttons.B] = true;
  }
  if (e.key === keyMapPlayer2.Up) {
    keyPressedPlayer2[Buttons.Up] = true;
  }
  if (e.key === keyMapPlayer2.Down) {
    keyPressedPlayer2[Buttons.Down] = true;
  }
  if (e.key === keyMapPlayer2.Left) {
    keyPressedPlayer2[Buttons.Left] = true;
  }
  if (e.key === keyMapPlayer2.Right) {
    keyPressedPlayer2[Buttons.Right] = true;
  }

  nes.controller1.setButtons(keyPressedPlayer2, ControllerPlayer.Two);
});

document.addEventListener("keyup", (e: KeyboardEvent) => {
  if (e.key === keyMapPlayer2.Start) {
    keyPressedPlayer2[Buttons.Start] = false;
  }
  if (e.key === keyMapPlayer2.Select) {
    keyPressedPlayer2[Buttons.Select] = false;
  }
  if (e.key === keyMapPlayer2.A) {
    keyPressedPlayer2[Buttons.A] = false;
  }
  if (e.key === keyMapPlayer2.B) {
    keyPressedPlayer2[Buttons.B] = false;
  }
  if (e.key === keyMapPlayer2.Up) {
    keyPressedPlayer2[Buttons.Up] = false;
  }
  if (e.key === keyMapPlayer2.Down) {
    keyPressedPlayer2[Buttons.Down] = false;
  }
  if (e.key === keyMapPlayer2.Left) {
    keyPressedPlayer2[Buttons.Left] = false;
  }
  if (e.key === keyMapPlayer2.Right) {
    keyPressedPlayer2[Buttons.Right] = false;
  }

  nes.controller1.setButtons(keyPressedPlayer2, ControllerPlayer.Two);
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

setTimeout(run, 1000);


document.getElementById("btn-scale-2").click();
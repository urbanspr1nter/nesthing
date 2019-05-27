import { Nes } from "./nes";

const WIDTH = 256;
const HEIGHT = 240;

const backCanvas = document.createElement("canvas");
const backContext = backCanvas.getContext("2d", {
  alpha: false
});
backCanvas.width = WIDTH;
backCanvas.height = HEIGHT;

const canvas = document.getElementById("main") as HTMLCanvasElement;
const context = canvas.getContext("2d");

const nes = new Nes();

const prevBuffer = {
  buffer: [] as string[][]
};

const pixelCache: { [id: string]: HTMLCanvasElement } = {};

for (let i = 0; i < HEIGHT; i++) {
  prevBuffer.buffer[i] = [];
  for (let j = 0; j < WIDTH; j++) {
    prevBuffer.buffer[i].push(undefined);
  }
}

let currentCycles = 0;
function drawFrame(frameBuffer: string[][]) {
  // const start = performance.now();
  for (let i = 0; i < HEIGHT; i++) {
    for (let j = 0; j < WIDTH; j++) {
      if (!frameBuffer[i][j]) {
        break;
      }

      if (
        prevBuffer.buffer[i][j] === undefined &&
        prevBuffer.buffer[i][j] === frameBuffer[i][j]
      ) {
        continue;
      }

      prevBuffer.buffer[i][j] = frameBuffer[i][j];

      backContext.strokeStyle = frameBuffer[i][j];
      backContext.beginPath();
      backContext.moveTo(j, i);
      backContext.lineTo(j + 1, i);
      backContext.stroke();
    }
    backContext.closePath();
  }

  // console.log(`RENDER TIME: ${performance.now() - start}`);
}

function renderFrame() {
  currentCycles += nes.run(1865);
  if (currentCycles >= 29833) {
    currentCycles = 0;
    requestAnimationFrame(() => {
      drawFrame(nes.frameBuffer());
      context.putImageData(backContext.getImageData(0, 0, 256, 240), 0, 0);
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

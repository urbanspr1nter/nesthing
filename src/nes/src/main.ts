import { Nes } from "./nes";

const WIDTH = 256;
const HEIGHT = 240;
const TOTAL_PIXELS = 256 * 240;

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

let currentCycles = 0;
function drawFrame(frameBuffer: string[][]) {
  // const start = performance.now();
  for (let i = 0; i < HEIGHT; i++) {
    for (let j = 0; j < WIDTH; j++) {
      if (
        prevBuffer.buffer[i][j] !== "" &&
        prevBuffer.buffer[i][j] === frameBuffer[i][j]
      ) {
        continue;
      }

      prevBuffer.buffer[i][j] = frameBuffer[i][j];
      context.fillStyle = prevBuffer.buffer[i][j];
      context.fillRect(j, i, 1, 1);
    }
  }

  // console.log(`RENDER TIME: ${performance.now() - start}`);
}

function renderFrame() {
  //const start = performance.now();
  currentCycles += nes.run(1865);
  //console.log(`EXEC TIME: ${performance.now() - start}`);

  if (currentCycles >= 29833) {
    currentCycles = 0;
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

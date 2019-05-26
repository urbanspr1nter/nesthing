import { Nes } from "./nes";
import { buildRgbString } from "./utils";

const WIDTH = 256;
const HEIGHT = 240;

const backCanvas = document.createElement("canvas");
backCanvas.width = WIDTH;
backCanvas.height = HEIGHT;

const backContext = backCanvas.getContext("2d");

const canvas = document.getElementById("main") as HTMLCanvasElement;
const context = canvas.getContext("2d");

context.fillStyle = "rgb(0, 0, 192)";
context.fillRect(0, 0, WIDTH, HEIGHT);

const nes = new Nes();

let currentCycles = 0;
function drawFrame(frameBuffer) {
  for (let i = 0; i < HEIGHT; i++) {
    for (let j = 0; j < WIDTH; j++) {
      if (!frameBuffer[i][j]) {
        break;
      }
      backContext.strokeStyle = buildRgbString(frameBuffer[i][j]);

      backContext.beginPath();
      backContext.moveTo(j, i);
      backContext.lineTo(j + 1, i + 1);
      backContext.stroke();
      backContext.closePath();
    }
  }
}

function renderFrame() {
  currentCycles += nes.run(1000);
  if (currentCycles >= 29833) {
    currentCycles = 0;
    drawFrame(nes.frameBuffer());
    context.drawImage(backCanvas, 0, 0, WIDTH, HEIGHT)
  }
}

function run() {
  setImmediate(function() {
    renderFrame();
    run();
  });
}

setTimeout(run, 1000);

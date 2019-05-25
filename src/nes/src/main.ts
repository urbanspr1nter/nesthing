import { Nes } from './nes';
import { buildRgbString } from './utils';

const canvas = document.getElementById("main") as HTMLCanvasElement;
const context = canvas.getContext("2d");

context.fillStyle = "rgb(0, 0, 192)";
context.fillRect(0, 0, 256, 240);

const nes = new Nes();

function processFrame(frameBuffer) {
    for (let i = 0; i < 240; i++) {
        for (let j = 0; j < 256; j++) {
            if (!frameBuffer[i][j]) {
            break;
            }
            context.strokeStyle = buildRgbString(frameBuffer[i][j]);

            context.beginPath();
            context.moveTo(j, i);
            context.lineTo(j + 1, i + 1);
            context.stroke();
            context.closePath();
        }
    }
}

function renderFrame() {
    let frameBuffer = nes.frameBuffer();
    let start = performance.now();
    nes.run(29833);
    console.log(`1. EXEC TIME TIME - ${performance.now() - start}`);
    start = performance.now();
    processFrame(frameBuffer);
    console.log(`2. RENDER TIME - ${performance.now() - start}`);
}

function run() {
    setTimeout(function() { 
        requestAnimationFrame(renderFrame); 
        run(); 
    }, 16);
}

run();
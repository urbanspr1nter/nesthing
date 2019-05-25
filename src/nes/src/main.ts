import { Nes } from './nes';
import { buildRgbString } from './utils';

const canvas = document.getElementById("main") as HTMLCanvasElement;
const context = canvas.getContext("2d");

context.fillStyle = "rgb(0, 0, 192)";
context.fillRect(0, 0, 256, 240);

const nes = new Nes();

let currentCycles = 0;
function drawFrame(frameBuffer) {
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
    currentCycles += nes.run(7459);
    if(currentCycles >= 29833) {
        currentCycles = 0;
        drawFrame(nes.frameBuffer());
    }
}

function run() {
    setTimeout(function() { 
        requestAnimationFrame(renderFrame); 
        run(); 
    }, 4);
}

setTimeout(run, 1000);
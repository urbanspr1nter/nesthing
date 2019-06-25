import { Nes } from "../nes";
import { FrameBuffer } from "../framebuffer";

const WIDTH = 256;
const HEIGHT = 240;

export class UiFrameBuffer {
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _prevBuffer: { buffer: string[][] }
  private _buffer: string[][];
  private _frameBuffer: FrameBuffer;

  constructor(frameBuffer: FrameBuffer) {
    this._frameBuffer = frameBuffer;

    this._buffer = [];
    this._prevBuffer = { buffer: [] };
    this._clearPixelBuffer();

    this._canvas = document.getElementById("main") as HTMLCanvasElement;
    this._context = this._canvas.getContext("2d", { alpha: false });
    this._context.imageSmoothingEnabled = false;

    this.drawFrame();
  }

  public scale(factor: number) {
    this._canvas.width = factor * WIDTH;
    this._canvas.height = factor * HEIGHT;
    this._context.scale(factor, factor);

    this._clearPixelBuffer();
    this.drawFrame();
  }

  public drawScanline(scanline: number) {
    this._buffer = this._frameBuffer.buffer();

    for(let i = 0; i < WIDTH; i++) {
      if (this._prevBuffer.buffer[scanline][i] === this._buffer[scanline][i]) {
        continue;
      }

      this._prevBuffer.buffer[scanline][i] = this._buffer[scanline][i];
      this._context.fillStyle = this._prevBuffer.buffer[scanline][i];
      this._context.fillRect(i, scanline, 1, 1);
    }
  }

  public drawPixel(dot: number, scanline: number, color: string) {
    if(this._prevBuffer.buffer[scanline][dot] === color) {
      return;
    }

    this._prevBuffer.buffer[scanline][dot] = color;
    this._context.fillStyle = this._prevBuffer.buffer[scanline][dot];
    this._context.fillRect(dot, scanline, 1, 1);
  }

  public drawFrame() {
    this._buffer = this._frameBuffer.buffer();
    for (let i = 0; i < HEIGHT; i++) {
      for (let j = 0; j < WIDTH; j++) {
        if (this._prevBuffer.buffer[i][j] === this._buffer[i][j]) {
          continue;
        }

        this._prevBuffer.buffer[i][j] = this._buffer[i][j];
        this._context.fillStyle = this._prevBuffer.buffer[i][j];
        this._context.fillRect(j, i, 1, 1);
      }
    }
  }

  private _clearPixelBuffer() {
    for (let i = 0; i < HEIGHT; i++) {
      if (this._prevBuffer.buffer[i]) {
        this._prevBuffer.buffer[i] = [];
      } else {
        this._prevBuffer.buffer.push([]);
      }
      for (let j = 0; j < WIDTH; j++) {
        this._prevBuffer.buffer[i].push("");
      }
    }
  }
}
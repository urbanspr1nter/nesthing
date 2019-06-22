import { Nes } from "../nes";

const WIDTH = 256;
const HEIGHT = 240;

export class UiFrameBuffer {
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _prevBuffer: { buffer: string[][] }
  private _buffer: string[][];
  private _nes: Nes;

  constructor(nes: Nes) {
    this._nes = nes;

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

  public drawFrame() {
    this._buffer = this._nes.frameBuffer();
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
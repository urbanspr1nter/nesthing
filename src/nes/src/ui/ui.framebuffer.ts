import { Nes } from "../nes";
import { FrameBuffer } from "../framebuffer";

const WIDTH = 256;
const HEIGHT = 240;

export class UiFrameBuffer {
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _imageData: ImageData;
  private _bufferView: ArrayBuffer;
  private _image8Buffer: Uint8ClampedArray;
  private _image32Buffer: Uint32Array;
  private _prevBuffer: { buffer: string[][] };
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
    this._imageData = this._context.createImageData(WIDTH, HEIGHT);
    this._bufferView = new ArrayBuffer(this._imageData.data.length);
    this._image8Buffer = new Uint8ClampedArray(this._bufferView);
    this._image32Buffer = new Uint32Array(this._bufferView);

    this.drawFrame();
  }

  public scale(factor: number) {
    this._canvas.width = factor * WIDTH;
    this._canvas.height = factor * HEIGHT;
    this._context.scale(factor, factor);

    this._clearPixelBuffer();
    this.drawFrame();
  }

  public drawScanline() {
    this._imageData.data.set(this._image8Buffer);
    this._context.putImageData(this._imageData, 0, 0);
  }

  public drawPixel(dot: number, scanline: number, color: number) {
    this._image32Buffer[scanline * WIDTH + dot] =
      (0xff << 24) |
      ((color & 0x0000ff) << 16) |
      (color & 0x00ff00) |
      (color >>> 16);
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

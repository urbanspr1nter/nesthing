/**
 * framebuffer.ts
 * 
 * Roger Ngo, 2019
 * 
 * Handles rendering of the pixels onto an HTML5 canvas using 
 * typed-arrays.
 */
import {
  DEFAULT_FRAME_BUFFER_COLOR,
  SCREEN_HEIGHT,
  SCREEN_WIDTH
} from "./constants";

export class UiFrameBuffer {
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _imageData: ImageData;
  private _bufferView: ArrayBuffer;
  private _image8Buffer: Uint8ClampedArray;
  private _image32Buffer: Uint32Array;

  constructor() {
    this._canvas = document.getElementById("main") as HTMLCanvasElement;
    this._context = this._canvas.getContext("2d", { alpha: false });
    this._context.imageSmoothingEnabled = false;

    this._initializePixelBuffer();
    this._clearPixelBuffer();
    this.draw();
  }

  public drawPixel(dot: number, scanline: number, color: number) {
    this._image32Buffer[scanline * SCREEN_WIDTH + dot] = color;
  }

  public draw() {
    this._imageData.data.set(this._image8Buffer);
    this._context.putImageData(this._imageData, 0, 0);
  }

  private _initializePixelBuffer() {
    this._imageData = this._context.createImageData(
      SCREEN_WIDTH,
      SCREEN_HEIGHT
    );
    this._bufferView = new ArrayBuffer(this._imageData.data.length);
    this._image8Buffer = new Uint8ClampedArray(this._bufferView);
    this._image32Buffer = new Uint32Array(this._bufferView);
  }

  private _clearPixelBuffer() {
    this._context.fillStyle = DEFAULT_FRAME_BUFFER_COLOR;
    this._context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
}

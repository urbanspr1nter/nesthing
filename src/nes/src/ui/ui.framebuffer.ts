const WIDTH = 256;
const HEIGHT = 240;

export class UiFrameBuffer {
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _imageData: ImageData;
  private _bufferView: ArrayBuffer;
  private _image8Buffer: Uint8ClampedArray;
  private _image32Buffer: Uint32Array;
  private _factor: number;

  constructor() {
    this._canvas = document.getElementById("main") as HTMLCanvasElement;
    this._context = this._canvas.getContext("2d", { alpha: false });
    this._context.imageSmoothingEnabled = false;

    this._imageData = this._context.createImageData(WIDTH, HEIGHT);
    this._bufferView = new ArrayBuffer(this._imageData.data.length);
    this._image8Buffer = new Uint8ClampedArray(this._bufferView);
    this._image32Buffer = new Uint32Array(this._bufferView);

    this._factor = 1;
    this._clearPixelBuffer();
    this.draw();
  }

  public scale(factor: number) {
    this._factor = factor;
    this._canvas.width = this._factor * WIDTH;
    this._canvas.height = this._factor * HEIGHT;
    this._context.scale(this._factor, this._factor);

    this._clearPixelBuffer();
    this.draw();
  }

  public drawPixel(dot: number, scanline: number, color: number) {
    this._image32Buffer[scanline * WIDTH + dot] = color;
  }

  public draw() {
    this._imageData.data.set(this._image8Buffer);
    this._context.putImageData(this._imageData, 0, 0);
  }

  private _clearPixelBuffer() {
    this._context.fillStyle = "#0000C0";
    this._context.fillRect(0, 0, this._factor * WIDTH, this._factor * HEIGHT);
  }
}

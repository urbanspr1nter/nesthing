const WIDTH = 256;
const HEIGHT = 240;

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

    this._imageData = this._context.createImageData(WIDTH, HEIGHT);
    this._bufferView = new ArrayBuffer(this._imageData.data.length);
    this._image8Buffer = new Uint8ClampedArray(this._bufferView);
    this._image32Buffer = new Uint32Array(this._bufferView);

    this._clearPixelBuffer();
    this.draw();
  }

  public scale(factor: number) {
    this._canvas.width = factor * WIDTH;
    this._canvas.height = factor * HEIGHT;
    this._context.scale(factor, factor);

    this._clearPixelBuffer();
    this.draw();
  }

  public drawPixel(dot: number, scanline: number, color: number) {
    this._image32Buffer[scanline * WIDTH + dot] =
      (0xff << 24) |
      ((color & 0x0000ff) << 16) |
      (color & 0x00ff00) |
      (color >>> 16);
  }

  public draw() {
    this._imageData.data.set(this._image8Buffer);
    this._context.putImageData(this._imageData, 0, 0);
  }

  private _clearPixelBuffer() {
    this._context.fillStyle = "#000000";
    this._context.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

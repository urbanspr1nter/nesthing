/**
 * framebuffer.ts
 * 
 * Roger Ngo, 2019
 */

import {
  DEFAULT_FRAME_BUFFER_COLOR,
  SCREEN_HEIGHT,
  SCREEN_WIDTH
} from "./constants";

/**
 * The UiFrameBuffer class handles the rendering of pixels onto an HTML5 
 * canvas using typed arrays.
 * 
 * Note that this uses 32 bit colors with the format: ABGR. Canvas element 
 * colors are ARGB. Therefore, it is assumed that the color input is from the 
 * preprocessed values found within the PpuPalette.
 */
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

  /**
   * Assigns the color at the appropriate pixel at the frame buffer 
   * location. Does not render out to the screen.
   * 
   * @param dot The "x coordinate" of the screen
   * @param scanline The "y coordinate" of the screen
   * @param color The 32 bit color to use within the PPU palette
   */
  public drawPixel(dot: number, scanline: number, color: number) {
    this._image32Buffer[scanline * SCREEN_WIDTH + dot] = color;
  }

  /**
   * Renders all contents within the frame buffer onto the screen, 
   * or in this case, the HTML5 canvas.
   */
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

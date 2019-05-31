const TOTAL_SCANLINES = 240;
const TOTAL_DOTS = 256;

export interface ColorComponent {
  r: number;
  g: number;
  b: number;
}

export class FrameBuffer {
  private _frameBuffer: string[][];

  constructor() {
    this._initializeFrameBuffer();
  }

  public buffer(): string[][] {
    return this._frameBuffer;
  }

  public draw(row: number, column: number, color: string): void {
    if (!this._frameBuffer[row]) {
      return;
    }

    this._frameBuffer[row][column] = color;
  }

  /**
   * Initializes the frame buffer.
   *
   * This will store the representation of the screen.
   *
   * Since the resolution is 256x240 for the NES, we have
   * decided to use a 2D array of 256 rows, and 240 columns.
   *
   * Each element represents a single pixel.
   */
  private _initializeFrameBuffer(): void {
    this._frameBuffer = [];
    for (let i = 0; i < TOTAL_SCANLINES; i++) {
      this._frameBuffer.push([]);
      for (let j = 0; j < TOTAL_DOTS; j++) {
        this._frameBuffer[i].push("#000088");
      }
    }
  }
}

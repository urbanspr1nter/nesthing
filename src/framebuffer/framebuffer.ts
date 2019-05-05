import { ColorComponent } from "../nes/common/interface";
import * as ColorPalette from "../utils/colors.json";

export const NesPpuPalette: { [id: string]: ColorComponent } = ColorPalette;

const TOTAL_SCANLINES = 240;
const TOTAL_DOTS = 256;
const DEFAULT_COLOR: ColorComponent = { r: 0, g: 0, b: 192 };

export class FrameBuffer {
  private _frameBuffer: ColorComponent[][];

  constructor() {
    this._initializeFrameBuffer();
  }

  public get buffer(): ColorComponent[][] {
    return this._frameBuffer;
  }

  public draw(row: number, column: number, color: ColorComponent): void {
    if (!this._frameBuffer[row]) {
      return;
    }

    this._frameBuffer[row][column] = color;
  }

  public getColor(colorByte: number): ColorComponent {
    let key = colorByte.toString(16).toUpperCase();
    if (key.length < 2) {
      key = `0${key}`;
    }

    return NesPpuPalette[key];
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
        this._frameBuffer[i].push(DEFAULT_COLOR);
      }
    }
  }
}

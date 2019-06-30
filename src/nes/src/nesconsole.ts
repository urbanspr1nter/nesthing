import { Nes, Roms, NesOptions } from "./nes";
import { UiFrameBuffer } from "./ui/framebuffer";
import { UiKeyHandler } from "./ui/keyhandler";
import { Controller } from "./controller";

export class NesConsole {
  private _nes: Nes;
  private _options: NesOptions;
  private _lastFrameTime: number;
  private _frameTime: number;
  private _msPerFrame: number;
  private _ppuFrames: number;

  constructor(rom: Roms) {
    const playerOneController = new Controller();
    const playerTwoController = new Controller();

    this._options = {
      keyHandler: new UiKeyHandler(playerOneController, playerTwoController),
      frameRenderer: new UiFrameBuffer(),
      controller: {
        one: playerOneController,
        two: playerTwoController
      },
      rom
    };

    this._nes = new Nes(this._options);
    this._frameTime = 0;
    this._lastFrameTime = 0;
    this._ppuFrames = 0;
    this._msPerFrame = 1000 / 60;
  }

  get nes() {
    return this._nes;
  }

  public setupDOM() {
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerOneKeyDown(e.key);
    });
    document.addEventListener("keyup", (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerOneKeyUp(e.key);
    });
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerTwoKeyDown(e.key);
    });
    document.addEventListener("keyup", (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerTwoKeyUp(e.key);
    });
  }

  public run(timestamp: number) {
    if (this._lastFrameTime === 0) {
      this._lastFrameTime = timestamp;
    }

    this._frameTime += timestamp - this._lastFrameTime;
    this._lastFrameTime = timestamp;

    while (this._frameTime >= this._msPerFrame) {
      INNER: while (true) {
        this._ppuFrames = this._nes.ppuFrames;
        this._nes.run();
        if (this._nes.ppuFrames > this._ppuFrames) {
          break INNER;
        }
      }
      this._frameTime -= this._msPerFrame;
      break;
    }

    requestAnimationFrame(t => this.run(t));
  }
}

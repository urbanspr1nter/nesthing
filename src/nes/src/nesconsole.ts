import { Nes, NesOptions, ConsoleState } from "./nes";
import { UiFrameBuffer } from "./ui/framebuffer";
import { UiKeyHandler } from "./ui/keyhandler";
import { Controller } from "./controller";
import { EventEmitter } from "events";
import { Roms } from "./ui/rommanager";

const ONE_SECOND_MS = 1000;
const FPS = 60;
const KEY_UP_EVENT = "keyup";
const KEY_DOWN_EVENT = "keydown";

export class NesConsole {
  private _isRunning: boolean;
  private _eventEmitter: EventEmitter;
  private _nes: Nes;
  private _options: NesOptions;
  private _lastFrameTime: number;
  private _frameTime: number;
  private _msPerFrame: number;
  private _ppuFrames: number;
  private _lastFps: string;

  constructor(rom: Roms, canvasId: string, eventEmitter: EventEmitter) {
    const playerOneController = new Controller();
    const playerTwoController = new Controller();

    this._options = {
      keyHandler: new UiKeyHandler(playerOneController, playerTwoController),
      frameRenderer: new UiFrameBuffer(canvasId),
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
    this._msPerFrame = ONE_SECOND_MS / FPS;

    this._lastFps = "0.0";
    this._isRunning = true;

    this._eventEmitter = eventEmitter;
    
    this._eventEmitter.on("stop", () => {
      this._isRunning = false;
    });
  }

  get nes() {
    return this._nes;
  }

  public save() {
    return JSON.stringify(this._nes.save());
  }

  public load(state: ConsoleState) {
    this._nes.load(state);
  }

  public setupDOM() {
    document.addEventListener(KEY_DOWN_EVENT, (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerOneKeyDown(e.key);
    });
    document.addEventListener(KEY_UP_EVENT, (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerOneKeyUp(e.key);
    });
    document.addEventListener(KEY_DOWN_EVENT, (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerTwoKeyDown(e.key);
    });
    document.addEventListener(KEY_DOWN_EVENT, (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerTwoKeyUp(e.key);
    });
  }

  public run(timestamp: number) {
    if(!this._isRunning) {
      return;
    }

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

          // Calculate current FPS
          const currFps = (ONE_SECOND_MS / this._frameTime).toFixed(2);
          if(currFps !== this._lastFps && (this._ppuFrames % FPS) === 0) {
            document.getElementById("fps").innerHTML = `${currFps} fps`;
            this._lastFps = currFps;
          }

          // Handle joypad
          this._options.keyHandler.handlePlayerOneJoypad();
          break INNER;
        }
      }

      this._frameTime -= this._msPerFrame;
      // break;
    }

    setImmediate(() => this.run(performance.now()));
  }
}

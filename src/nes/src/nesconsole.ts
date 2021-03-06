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
  private _cumulativeFrameTime: number;
  private _frameCounter: number;

  constructor(
    rom: Roms,
    canvasId: string,
    eventEmitter: EventEmitter,
    pf: any
  ) {

    this._init(canvasId, rom, pf);
    this._eventEmitter = eventEmitter;

    this._eventEmitter.on("stop", () => {
      this._isRunning = false;
    });

    this._eventEmitter.on("start", () => {
      this._init(canvasId, rom, pf);
    });

    this._cumulativeFrameTime = 0;
    this._frameCounter = 0;
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
      this._options.keyHandler.handlePlayerTwoKeyDown(e.key);
    });
    document.addEventListener(KEY_UP_EVENT, (e: KeyboardEvent) => {
      this._options.keyHandler.handlePlayerOneKeyUp(e.key);
      this._options.keyHandler.handlePlayerTwoKeyUp(e.key);
    });
  }

  public run(timestamp: number) {
    if (!this._isRunning) {
      return;
    }

    if (this._lastFrameTime === 0) {
      this._lastFrameTime = timestamp;
    }

    this._frameTime += timestamp - this._lastFrameTime;
    this._cumulativeFrameTime += (timestamp - this._lastFrameTime);
    this._lastFrameTime = timestamp;

    while (this._frameTime >= this._msPerFrame) {
      INNER: while (true) {
        this._ppuFrames = this._nes.ppuFrames;
        this._nes.run();
        if (this._nes.ppuFrames > this._ppuFrames) {
          // Calculate current FPS
          this._putFps();

          // Handle joypad
          this._options.keyHandler.handlePlayerOneJoypad();
          break INNER;
        }
      }

      this._frameTime -= this._msPerFrame;
      break;
    }
    
    setImmediate(() => this.run(performance.now()));
  }

  private _putFps() {
    this._frameCounter++;

    if(this._cumulativeFrameTime >= ONE_SECOND_MS) {
      const currFps = this._frameCounter.toFixed(1);
      if (currFps !== this._lastFps) {
        document.getElementById("nes-console-fps").innerHTML = `${currFps}`;
        this._lastFps = currFps;
      }
      this._cumulativeFrameTime = 0;
      this._frameCounter = 0;
    }
  }


  private _init(canvasId: string, rom: Roms, pf: any) {
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

    this._nes = new Nes(this._options, pf);
    this._frameTime = 0;
    this._lastFrameTime = 0;
    this._ppuFrames = 0;
    this._msPerFrame = ONE_SECOND_MS / FPS;

    this._lastFps = "0.0";
    this._isRunning = true;
  }
}

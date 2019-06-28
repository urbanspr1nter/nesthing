export enum Buttons {
  A = 0,
  B = 1,
  Select = 2,
  Start = 3,
  Up = 4,
  Down = 5,
  Left = 6,
  Right = 7
}

export enum ControllerPlayer {
  One = 0,
  Two = 1
}

export class Controller {
  private _buttonMapPlayer: { [id: number]: boolean };

  private _strobePlayer: number;
  private _indexPlayer: number;

  constructor() {
    this._buttonMapPlayer = {
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
      7: false
    };

    this._strobePlayer = 0;
    this._indexPlayer = 0;
  }

  public setButtons(map: { [id: number]: boolean }) {
    this._buttonMapPlayer = map;
  }

  public write(value: number) {
    this._strobePlayer = value;
    if ((this._strobePlayer & 1) === 1) {
      this._indexPlayer = 0;
    }
  }

  public read() {
    let value = 0;

    if (this._indexPlayer < 8 && this._buttonMapPlayer[this._indexPlayer]) {
      value = 1;
    }
    this._indexPlayer++;

    if ((this._strobePlayer & 1) === 1) {
      this._indexPlayer = 0;
    }

    return value & 0xff;
  }
}

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
  private _buttonMapPlayer1: { [id: number]: boolean };

  private _strobePlayer1: number;
  private _indexPlayer1: number;

  constructor() {
    this._buttonMapPlayer1 = {
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
      7: false
    };

    this._strobePlayer1 = 0;
    this._indexPlayer1 = 0;
  }

  public setButtons(map: { [id: number]: boolean }) {
    this._buttonMapPlayer1 = map;
  }

  public write(value: number) {
    this._strobePlayer1 = value;
    if ((this._strobePlayer1 & 1) === 1) {
      this._indexPlayer1 = 0;
    }
  }

  public read() {
    let value = 0;

    if (this._indexPlayer1 < 8 && this._buttonMapPlayer1[this._indexPlayer1]) {
      value = 1;
    }
    this._indexPlayer1++;

    if ((this._strobePlayer1 & 1) === 1) {
      this._indexPlayer1 = 0;
    }

    return value;
  }
}

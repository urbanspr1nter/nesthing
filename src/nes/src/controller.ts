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
  private _buttonIndex: number;

  constructor() {
    this._buttonMapPlayer = {
      [Buttons.A]: false,
      [Buttons.B]: false,
      [Buttons.Select]: false,
      [Buttons.Start]: false,
      [Buttons.Up]: false,
      [Buttons.Down]: false,
      [Buttons.Left]: false,
      [Buttons.Right]: false
    };

    this._strobePlayer = 0;
    this._buttonIndex = 0;
  }

  public setButtons(map: { [id: number]: boolean }) {
    this._buttonMapPlayer = map;
  }

  public write(value: number) {
    this._strobePlayer = value;
    if ((this._strobePlayer & 1) === 1) {
      this._buttonIndex = 0;
    }
  }

  public read() {
    let value = 0;

    if (this._buttonIndex < 8 && this._buttonMapPlayer[this._buttonIndex]) {
      value = 1;
    }
    this._buttonIndex++;

    if ((this._strobePlayer & 1) === 1) {
      this._buttonIndex = 0;
    }

    return value & 0xff;
  }
}

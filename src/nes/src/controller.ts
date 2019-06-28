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
  private _buttonMapPlayer2: { [id: number]: boolean };

  private _strobePlayer1: number;
  private _indexPlayer1: number;
  private _strobePlayer2: number;
  private _indexPlayer2: number;

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
    this._buttonMapPlayer2 = {
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

  public setButtons = (
    map: { [id: number]: boolean },
    player: ControllerPlayer
  ) => {
    if (player === ControllerPlayer.One) {
      this._buttonMapPlayer1 = {...map};
    } else {
      this._buttonMapPlayer2 = {...map};
    }
  };

  public write = (value: number, player: ControllerPlayer) => {
    if (player === ControllerPlayer.One) {
      this._strobePlayer1 = value;
      if ((this._strobePlayer1 & 1) === 1) {
        this._indexPlayer1 = 0;
      }
    } else {
      this._strobePlayer2 = value;
      if ((this._strobePlayer2 & 1) === 1) {
        this._indexPlayer2 = 0;
      }
    }
  };

  public read = (player: ControllerPlayer): number => {
    let value = 0;

    if (player === ControllerPlayer.One) {
      if (
        this._indexPlayer1 < 8 &&
        this._buttonMapPlayer1[this._indexPlayer1]
      ) {
        value = 1;
      }
      this._indexPlayer1++;

      if ((this._strobePlayer1 & 1) === 1) {
        this._indexPlayer1 = 0;
      }
    } else {
      if (
        this._indexPlayer2 < 8 &&
        this._buttonMapPlayer2[this._indexPlayer2]
      ) {
        value = 1;
      }
      this._indexPlayer2++;

      if ((this._strobePlayer2 & 1) === 1) {
        this._indexPlayer2 = 0;
      }
    }

    return value;
  };
}

import { Controller, Buttons } from "../controller";
import { PlayerOneKeyMap, PlayerTwoKeyMap, PlayerOneJoyMap } from "./constants";

export class UiKeyHandler {
  private _controllerOne: Controller;
  private _controllerTwo: Controller;
  private _gamepad: Gamepad;

  private _keyPressedPlayer1: { [id: number]: boolean };
  private _keyPressedPlayer2: { [id: number]: boolean };

  constructor(controllerOne: Controller, controllerTwo: Controller) {
    this._controllerOne = controllerOne;
    this._controllerTwo = controllerTwo;

    this._keyPressedPlayer1 = {
      ...this._getDefaultKeySettings()
    };

    this._keyPressedPlayer2 = {
      ...this._getDefaultKeySettings()
    };
  }

  public handlePlayerOneJoypad() {
    this._gamepad = navigator.getGamepads()[0];

    if(!this._gamepad) {
      return;
    }

    for(let i = 0; i < 17; i++) {
      var gamepadButton = this._gamepad.buttons[i];
      if(gamepadButton.pressed) {
        if(i === PlayerOneJoyMap.X) {
          this._keyPressedPlayer1[Buttons.B] = true;
        }
        if(i === PlayerOneJoyMap.A) {
          this._keyPressedPlayer1[Buttons.A] = true;
        }
        if(i === PlayerOneJoyMap.UP) {
          this._keyPressedPlayer1[Buttons.Up] = true;
        }
        if(i === PlayerOneJoyMap.DOWN) {
          this._keyPressedPlayer1[Buttons.Down] = true;
        }
        if(i === PlayerOneJoyMap.LEFT) {
          this._keyPressedPlayer1[Buttons.Left] = true;
        }
        if(i === PlayerOneJoyMap.RIGHT) {
          this._keyPressedPlayer1[Buttons.Right] = true;
        }
        if(i === PlayerOneJoyMap.SELECT) {
          this._keyPressedPlayer1[Buttons.Select] = true;
        }
        if(i === PlayerOneJoyMap.START) {
          this._keyPressedPlayer1[Buttons.Start] = true;
        }
      } else {
        if(i === PlayerOneJoyMap.X) {
          this._keyPressedPlayer1[Buttons.B] = false;
        }
        if(i === PlayerOneJoyMap.A) {
          this._keyPressedPlayer1[Buttons.A] = false;
        }
        if(i === PlayerOneJoyMap.UP) {
          this._keyPressedPlayer1[Buttons.Up] = false;
        }
        if(i === PlayerOneJoyMap.DOWN) {
          this._keyPressedPlayer1[Buttons.Down] = false;
        }
        if(i === PlayerOneJoyMap.LEFT) {
          this._keyPressedPlayer1[Buttons.Left] = false;
        }
        if(i === PlayerOneJoyMap.RIGHT) {
          this._keyPressedPlayer1[Buttons.Right] = false;
        }
        if(i === PlayerOneJoyMap.SELECT) {
          this._keyPressedPlayer1[Buttons.Select] = false;
        }
        if(i === PlayerOneJoyMap.START) {
          this._keyPressedPlayer1[Buttons.Start] = false;
        }
      }
    }

    this._controllerOne.setButtons(this._keyPressedPlayer1);
  }

  public handlePlayerOneKeyDown(key: string) {
    if (key === PlayerOneKeyMap.Start) {
      this._keyPressedPlayer1[Buttons.Start] = true;
    }
    if (key === PlayerOneKeyMap.Select) {
      this._keyPressedPlayer1[Buttons.Select] = true;
    }
    if (key === PlayerOneKeyMap.A) {
      this._keyPressedPlayer1[Buttons.A] = true;
    }
    if (key === PlayerOneKeyMap.B) {
      this._keyPressedPlayer1[Buttons.B] = true;
    }
    if (key === PlayerOneKeyMap.Up) {
      this._keyPressedPlayer1[Buttons.Up] = true;
    }
    if (key === PlayerOneKeyMap.Down) {
      this._keyPressedPlayer1[Buttons.Down] = true;
    }
    if (key === PlayerOneKeyMap.Left) {
      this._keyPressedPlayer1[Buttons.Left] = true;
    }
    if (key === PlayerOneKeyMap.Right) {
      this._keyPressedPlayer1[Buttons.Right] = true;
    }

    this._controllerOne.setButtons(this._keyPressedPlayer1);
  }

  public handlePlayerOneKeyUp(key: string) {
    if (key === PlayerOneKeyMap.Start) {
      this._keyPressedPlayer1[Buttons.Start] = false;
    }
    if (key === PlayerOneKeyMap.Select) {
      this._keyPressedPlayer1[Buttons.Select] = false;
    }
    if (key === PlayerOneKeyMap.A) {
      this._keyPressedPlayer1[Buttons.A] = false;
    }
    if (key === PlayerOneKeyMap.B) {
      this._keyPressedPlayer1[Buttons.B] = false;
    }
    if (key === PlayerOneKeyMap.Up) {
      this._keyPressedPlayer1[Buttons.Up] = false;
    }
    if (key === PlayerOneKeyMap.Down) {
      this._keyPressedPlayer1[Buttons.Down] = false;
    }
    if (key === PlayerOneKeyMap.Left) {
      this._keyPressedPlayer1[Buttons.Left] = false;
    }
    if (key === PlayerOneKeyMap.Right) {
      this._keyPressedPlayer1[Buttons.Right] = false;
    }

    this._controllerOne.setButtons(this._keyPressedPlayer1);
  }

  public handlePlayerTwoKeyDown(key: string) {
    if (key === PlayerTwoKeyMap.Start) {
      this._keyPressedPlayer2[Buttons.Start] = true;
    }
    if (key === PlayerTwoKeyMap.Select) {
      this._keyPressedPlayer2[Buttons.Select] = true;
    }
    if (key === PlayerTwoKeyMap.A) {
      this._keyPressedPlayer2[Buttons.A] = true;
    }
    if (key === PlayerTwoKeyMap.B) {
      this._keyPressedPlayer2[Buttons.B] = true;
    }
    if (key === PlayerTwoKeyMap.Up) {
      this._keyPressedPlayer2[Buttons.Up] = true;
    }
    if (key === PlayerTwoKeyMap.Down) {
      this._keyPressedPlayer2[Buttons.Down] = true;
    }
    if (key === PlayerTwoKeyMap.Left) {
      this._keyPressedPlayer2[Buttons.Left] = true;
    }
    if (key === PlayerTwoKeyMap.Right) {
      this._keyPressedPlayer2[Buttons.Right] = true;
    }

    this._controllerTwo.setButtons(this._keyPressedPlayer2);
  }

  public handlePlayerTwoKeyUp(key: string) {
    if (key === PlayerTwoKeyMap.Start) {
      this._keyPressedPlayer2[Buttons.Start] = false;
    }
    if (key === PlayerTwoKeyMap.Select) {
      this._keyPressedPlayer2[Buttons.Select] = false;
    }
    if (key === PlayerTwoKeyMap.A) {
      this._keyPressedPlayer2[Buttons.A] = false;
    }
    if (key === PlayerTwoKeyMap.B) {
      this._keyPressedPlayer2[Buttons.B] = false;
    }
    if (key === PlayerTwoKeyMap.Up) {
      this._keyPressedPlayer2[Buttons.Up] = false;
    }
    if (key === PlayerTwoKeyMap.Down) {
      this._keyPressedPlayer2[Buttons.Down] = false;
    }
    if (key === PlayerTwoKeyMap.Left) {
      this._keyPressedPlayer2[Buttons.Left] = false;
    }
    if (key === PlayerTwoKeyMap.Right) {
      this._keyPressedPlayer2[Buttons.Right] = false;
    }

    this._controllerTwo.setButtons(this._keyPressedPlayer2);
  }

  private _getDefaultKeySettings(): { [id: number]: boolean } {
    const defaultMap: { [id: number]: boolean } = {
      [Buttons.A]: false,
      [Buttons.B]: false,
      [Buttons.Select]: false,
      [Buttons.Start]: false,
      [Buttons.Up]: false,
      [Buttons.Down]: false,
      [Buttons.Left]: false,
      [Buttons.Right]: false
    };

    return defaultMap;
  }
}

import { Controller, Buttons, ControllerPlayer } from "../controller";

export const PlayerOneKeyMap = {
  Start: "Enter",
  Select: "Shift",
  A: "j",
  B: "k",
  Up: "w",
  Down: "s",
  Left: "a",
  Right: "d"
};

export const PlayerTwoKeyMap = {
  Start: "/",
  Select: ".",
  A: "m",
  B: ",",
  Up: "ArrowUp",
  Down: "ArrowDown",
  Left: "ArrowLeft",
  Right: "ArrowRight"
};

export class UiKeyHandler {
  private _controller: Controller;
  private _keyPressedPlayer1: { [id: number]: boolean } = {
    ...this._getDefaultKeySettings()
  };
  private _keyPressedPlayer2: { [id: number]: boolean } = {
    ...this._getDefaultKeySettings()
  };

  constructor(controller: Controller) {
    this._controller = controller;
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

    this._controller.setButtons(this._keyPressedPlayer1, ControllerPlayer.One);
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

    this._controller.setButtons(this._keyPressedPlayer1, ControllerPlayer.One);
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

    this._controller.setButtons(this._keyPressedPlayer2, ControllerPlayer.Two);
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

    this._controller.setButtons(this._keyPressedPlayer2, ControllerPlayer.Two);
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

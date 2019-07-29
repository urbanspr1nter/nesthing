import * as React from "react";
import NesConsoleScreen from "./NesConsoleScreen";
import NesConsoleGameSelect, {
  NesConsoleGameSelectValue
} from "./NesConsoleGameSelect";
import NesConsoleButtons from "./NesConsoleButtons";
import { NesConsole } from "../../nesconsole";
import { EventEmitter } from "events";
import RomManager, { Roms } from "../../ui/rommanager";
import { DomCanvasId, NotificationType } from "../../constants";
import { setNotification } from "../../ui/notificationhelper";
import { ConsoleState } from "../../nes";
import { pako, saveStateData } from "../../savemanager";

export interface NesConsoleProps {
  options: NesConsoleGameSelectValue[];
  wasmModule: any;
}

export default class NesConsoleUi extends React.PureComponent<NesConsoleProps> {
  private _eventEmitter: EventEmitter;
  private _gameConsole: NesConsole;

  constructor(props: NesConsoleProps) {
    super(props);

    this._eventEmitter = new EventEmitter();
    this._gameConsole = null;
  }

  public componentDidMount() {
    document.getElementById("save-file").addEventListener("change", () => {
      const files = (document.getElementById("save-file") as HTMLInputElement)
        .files;
      if (files.length === 0) {
        return;
      }

      const file = files[0];

      document.getElementById("file-name").innerHTML = file.name;
    });

    document.getElementById("btn-load").addEventListener("click", () => {
      if (!this._gameConsole) {
        setNotification("Start a game!", NotificationType.Danger);
        return;
      }
      const files = (document.getElementById("save-file") as HTMLInputElement)
        .files;
      if (files.length === 0) {
        return;
      }

      const file = files[0];
      const reader = new FileReader();
      reader.onload = (function readFile(currentFile, gameConsole: NesConsole) {
        return function(e) {
          const jsonString = pako.inflate(e.target.result, { to: "string" });
          const data: ConsoleState = JSON.parse(jsonString);

          if (data.currentRom !== gameConsole.nes.rom) {
            setNotification("Game doesn't match!", NotificationType.Danger);
            return;
          }

          gameConsole.load(data);
        };
      })(file, this._gameConsole);

      reader.readAsText(file);
    });

    document.getElementById("btn-save").addEventListener("click", () => {
      const data = this._gameConsole.save();

      setNotification("Saved state!", NotificationType.Information);

      saveStateData(data, Roms[this._gameConsole.nes.rom]);
    });
  }

  public render() {
    const { options } = this.props;

    return (
      <div>
        <div id="nes-console-screen">
          <NesConsoleScreen />
        </div>
        <div className="nes-console-conntrols">
          <div id="nes-console-game-select-container">
            <NesConsoleGameSelect options={options} />
          </div>
          <div id="nes-console-buttons-container">
            <NesConsoleButtons
              onPlayClick={this._handlePlayClick.bind(this)}
              onResetClick={this._handleResetClick.bind(this)}
            />
          </div>
        </div>
      </div>
    );
  }

  private _handlePlayClick() {
    const { wasmModule } = this.props;

    this._eventEmitter.emit("stop");
    this._eventEmitter.removeAllListeners("stop");

    const selectElement = document.getElementById(
      "select-game"
    ) as HTMLSelectElement;
    const selectedGame = Number(
      selectElement.options[selectElement.selectedIndex].value
    );

    const game = RomManager.valueToGame(selectedGame);

    this._gameConsole = new NesConsole(
      game,
      DomCanvasId,
      this._eventEmitter,
      wasmModule
    );
    this._gameConsole.setupDOM();

    setTimeout(() => {
      setImmediate(() => this._gameConsole.run(performance.now()));
    }, 1000);
  }

  private _handleResetClick() {
    if (!this._gameConsole) {
      return;
    }
    this._gameConsole.nes.reset();
  }
}

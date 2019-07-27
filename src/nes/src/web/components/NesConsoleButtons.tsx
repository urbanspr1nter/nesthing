import * as React from "react";

require("./NesConsoleButtons.css");

export interface NesConsoleButtonsProps {
  onPlayClick: () => void;
  onResetClick: () => void;
}

export default class NesConsoleButtons extends React.Component<
  NesConsoleButtonsProps
> {
  constructor(props: NesConsoleButtonsProps) {
    super(props);
  }

  public render() {
    const { onPlayClick, onResetClick } = this.props;

    return (
      <div className="nes-console-buttons">
        <div className="field">
          <div className="control">
            <button
              type="button"
              className="nes-button"
              id="btn-play"
              onClick={onPlayClick}
            >
              <i className="fas fa-play" />
              &nbsp;PLAY
            </button>
          </div>
        </div>
        <div className="field">
          <div className="control">
            <button
              type="button"
              className="nes-button"
              id="btn-reset"
              onClick={onResetClick}
            >
              <i className="fas fa-redo-alt" />
              &nbsp;RESET
            </button>
          </div>
        </div>
      </div>
    );
  }
}

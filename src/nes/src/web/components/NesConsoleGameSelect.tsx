import * as React from "react";

require("./NesConsoleGameSelect.css");

export interface NesConsoleGameSelectValue {
  value: number;
  title: string;
}

export interface NesConsoleGameSelectProps {
  options: NesConsoleGameSelectValue[];
}

export default class NesConsoleGameSelect extends React.PureComponent<
  NesConsoleGameSelectProps
> {
  constructor(props: NesConsoleGameSelectProps) {
    super(props);
  }

  public render() {
    const { options } = this.props;
    return (
      <div className="nes-console-game-select">
        <div className="field">
          <div className="control">
            <div className="select">
              <select id="select-game">
                {options.map(o => (
                  <option value={o.value}>{o.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

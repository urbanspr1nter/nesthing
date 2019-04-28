import React from "react";
import { shortValue2HexString, byteValue2HexString } from "../utils/ui/utils";

interface CpuMemoryViewProps {
  data: number[];
}

interface CpuMemoryViewState {
  startAddress: number;
  endAddress: number;
}

export default class CpuMemoryView extends React.Component<
  CpuMemoryViewProps,
  CpuMemoryViewState
> {
  constructor(props: CpuMemoryViewProps) {
    super(props);

    this.state = {
        startAddress: 0,
        endAddress: 0
    };
  }

  public render = (): JSX.Element => {
    const containerStyle: React.CSSProperties = {
      maxWidth: "452px",
      height: "512px",
      maxHeight: "512px",
      display: "inline-block",
      border: "1px solid rgb(200, 200, 200)"
    };

    const containerTitleStyle: React.CSSProperties = {
      maxWidth: "452px",
      margin: "16px",
      fontWeight: 700
    };

    const controlContainerStyle: React.CSSProperties = {
      maxWidth: "420px",
      margin: "16px",
      paddingBottom: "16px",
      borderBottom: "1px solid rgb(200, 200, 200)"
    };

    const containerResultsStyle: React.CSSProperties = {
      overflowY: "scroll",
      overflowX: "hidden",
      fontSize: "medium",
      maxWidth: "442px",
      maxHeight: "380px",
      textAlign: "left",
      margin: "8px",
      fontFamily: "Monospace"
    };

    return (
      <div className="container" style={containerStyle}>
        <div className="container" style={containerTitleStyle}>
          <p>CPU Memory Finder</p>
        </div>
        <div className="container" style={controlContainerStyle}>
          <div className="columns">
            <div className="column">
              <div className="field is-horizontal">
                <div className="field-label is-small">
                  <label className="label is-small">Start</label>
                </div>
                <input
                  className="input"
                  type="text"
                  placeholder="STRT"
                  defaultValue="0000"
                  onChange={this._onStartChange}
                />
              </div>
            </div>
            <div className="column">
              <div className="field is-horizontal">
                <div className="field-label is-small">
                  <label className="label is-small">End</label>
                </div>
                <input
                  className="input"
                  type="text"
                  placeholder="0END"
                  defaultValue="0000"
                  onChange={this._onEndChange}
                />
              </div>
            </div>
            <div className="column">
              <button
                className="button is-dark"
                onClick={this._handleFindElements}
              >
                <span className="icon">
                  <i className="fas fa-search" />
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="container" style={containerResultsStyle}>
            {this._handleFindElements()}
        </div>
      </div>
    );
  };

  private _handleFindElements = (): JSX.Element => {
    const components: JSX.Element[] = [];
    for (let i = this.state.startAddress; i <= this.state.endAddress; i+=16) {
        components.push(this._getRowElements(i));
    }

    return (<div>{components}</div>);
  };

  private _onStartChange = (e: React.ChangeEvent): void => {
    const el = e.currentTarget as HTMLInputElement;

    const value = Number.parseInt(el.value, 16);

    this.setState({
      startAddress: value
    });
  };

  private _onEndChange = (e: React.ChangeEvent): void => {
    const el = e.currentTarget as HTMLInputElement;

    const value = Number.parseInt(el.value, 16);

    this.setState({
      endAddress: value
    });
  };

  private _getRowElements = (
    rowAddress: number
  ): JSX.Element => {
    const addressRowLabelStyle: React.CSSProperties = {
      fontWeight: 700,
      marginRight: "8px",
      display: "inline"
    };

    const byteColumnLabelStyle: React.CSSProperties = {
      display: "inline",
      marginRight: "4px",
      borderRight: "1px solid rgb(200, 200, 200)",
      paddingRight: "3px"
    };

    const elements: JSX.Element[] = [];

    elements.push(
      <div style={addressRowLabelStyle}>
        {`${shortValue2HexString(rowAddress)}`}:
      </div>
    );

    for (let i = rowAddress; i < rowAddress + 16; i++) {
      elements.push(
        <div style={byteColumnLabelStyle}>{`${byteValue2HexString(
          this.props.data[rowAddress + i]
        )}`}</div>
      );
    }

    return <div>{elements}</div>;
  };
}

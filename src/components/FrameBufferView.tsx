import "bulma/css/bulma.css";
import React from "react";
import { ColorComponent } from "../nes/framebuffer";
import { buildRgbString } from "../nes/utils";

interface FrameBufferViewProps {
  data: ColorComponent[][];
}

interface FrameBufferViewState {
  activeComponents: ColorComponent[][];
  focusedTileRow: number;
  focusedTileColumn: number;
}

export default class FrameBufferView extends React.Component<
  FrameBufferViewProps,
  FrameBufferViewState
> {
  constructor(props: FrameBufferViewProps) {
    super(props);

    this.state = {
      activeComponents: [[]],
      focusedTileRow: 0,
      focusedTileColumn: 0
    };
  }

  public componentDidMount = (): void => {
    this._focusOnTile();
  };

  public render = (): JSX.Element => {
    const overallContainerStyle: React.CSSProperties = {
      marginLeft: "24px",
      width: "340px",
      maxWidth: "340px",
      maxHeight: "1000px",
      padding: "8px",
      border: "1px solid rgb(200, 200, 200)"
    };

    const containerStyle: React.CSSProperties = {
      width: "300px",
      maxWidth: "300px",
      maxHeight: "800px",
      overflowY: "scroll",
      overflowX: "hidden",
      textAlign: "left",
      fontFamily: "Monospace"
    };

    const controlPanelStyle: React.CSSProperties = {
      width: "324px",
      maxWidth: "324px",
      maxHeight: "800px",
      paddingTop: "8px",
      paddingBottom: "8px",
      marginBottom: "16px",
      borderTop: "1px solid rgb(200, 200, 200)",
      borderBottom: "1px solid rgb(200, 200, 200)"
    };

    return (
      <div style={overallContainerStyle}>
        <h4 className="title is-4">Frame Buffer Tile Finder</h4>
        <div className="pixel-component-finder">
          <div className="container" style={controlPanelStyle}>
            <div className="columns">
              <div className="column">
                <div className="field is-horizontal">
                  <div className="field-label is-small">
                    <label className="label is-small">Row</label>
                  </div>
                  <input
                    className="input"
                    type="text"
                    placeholder="Row"
                    onChange={this._changeRowValue}
                    defaultValue={"0"}
                  />
                </div>
              </div>
              <div className="column">
                <div className="field is-horizontal">
                  <div className="field-label is-small">
                    <label className="label is-small">Col</label>
                  </div>
                  <input
                    className="input"
                    type="text"
                    placeholder="Column"
                    onChange={this._changeColumnValue}
                    defaultValue={"0"}
                  />
                </div>
              </div>
              <div className="column">
                <button className="button is-dark" onClick={this._focusOnTile}>
                  <span className="icon">
                    <i className="fas fa-sync" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="container" style={containerStyle}>
          {this._focusedComponents()}
        </div>
      </div>
    );
  };

  private _focusOnTile = (): void => {
    if (
      Number.isNaN(this.state.focusedTileColumn) ||
      Number.isNaN(this.state.focusedTileRow)
    ) {
      return;
    }

    let currentPixelRow = this.state.focusedTileRow * 8;
    let currentPixelColumn = this.state.focusedTileColumn * 8;

    const newComponents: ColorComponent[][] = [];
    for (let i = 0; i < 8; i++) {
      newComponents[i] = [];
    }
    for (let i = currentPixelRow; i < currentPixelRow + 8; i++) {
      for (let j = currentPixelColumn; j < currentPixelColumn + 8; j++) {
        newComponents[i - currentPixelRow].push(this.props.data[i][j]);
      }
    }

    this.setState({
      activeComponents: newComponents
    });
  };

  private _changeRowValue = (el: React.ChangeEvent): void => {
    const inputEl = el.currentTarget as HTMLInputElement;
    let value: number = Number.parseInt(inputEl.value);

    if (Number.isNaN(value) || (value < 0 && value > 29)) {
      value = 0;
    }

    this.setState(
      {
        focusedTileRow: value
      },
      this._focusOnTile
    );
  };

  private _changeColumnValue = (el: React.ChangeEvent): void => {
    const inputEl = el.currentTarget as HTMLInputElement;

    let value: number = Number.parseFloat(inputEl.value);

    if (Number.isNaN(value) || (value < 0 && value > 31)) {
      value = 0;
    }

    this.setState(
      {
        focusedTileColumn: value
      },
      this._focusOnTile
    );
  };

  private _focusedComponents = (): JSX.Element => {
    const components: JSX.Element[] = [];

    const currPixelContainerStyle: React.CSSProperties = {
      borderBottom: "1px solid rgb(200, 200, 200)"
    };
    const currPixelLocationStyle: React.CSSProperties = {
      fontSize: "small",
      fontWeight: 700,
      display: "inline-block",
      marginRight: "8px"
    };
    const currPixelStyle: React.CSSProperties = {
      fontSize: "small",
      display: "inline-block",
      marginRight: "8px"
    };

    this.state.activeComponents.forEach((r, i) => {
      const columnsAtRow = r;
      columnsAtRow.forEach((c, j) => {
        const currPixelColor: React.CSSProperties = {
          display: "inline-block",
          width: "8px",
          height: "8px",
          backgroundColor: buildRgbString(c)
        };

        components.push(
          <div style={currPixelContainerStyle}>
            <div style={currPixelLocationStyle}>{`${8 *
              this.state.focusedTileRow +
              i}, ${8 * this.state.focusedTileColumn + j}`}</div>
            <div style={currPixelStyle}>{JSON.stringify(c)}</div>
            <div style={currPixelColor} />
          </div>
        );
      });
    });

    return <div>{components}</div>;
  };
}

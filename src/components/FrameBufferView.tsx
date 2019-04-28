import "bulma/css/bulma.css";
import React, { DOMElement } from "react";
import { ColorComponent } from "../ppu/ppu";
import { byteValue2HexString } from "../utils/ui/utils";

interface FrameBufferViewProps {
  data: ColorComponent[][];
}

interface FrameBufferViewState {
  activeComponent: ColorComponent;
}

export default class FrameBufferView extends React.Component<
  FrameBufferViewProps,
  FrameBufferViewState
> {
  constructor(props: FrameBufferViewProps) {
    super(props);

    this.state = {
      activeComponent: {
        r: 0,
        g: 0,
        b: 0
      }
    };
  }

  public render = (): JSX.Element => {
    const { data } = this.props;

    const containerStyle: React.CSSProperties = {
      maxWidth: "512px",
      maxHeight: "256px",
      overflowY: "scroll",
      overflowX: "scroll",
      textAlign: "left",
      fontFamily: "Monospace"
    };

    const activeComponentStyle: React.CSSProperties = {
      fontWeight: 700,
      fontSize: "medium"
    };

    return (
      <div>
        <div className="pixel-component-view" style={activeComponentStyle}>
          {JSON.stringify(this.state.activeComponent)}
        </div>
        <div className="container" style={containerStyle}>
          {data.map((colorRow, idx) => {
            const result = [];
            result.push(<h3 style={{ marginBottom: "4px" }}>Row: {idx}</h3>);
            result.push(this._buildRow(colorRow, idx));

            return result;
          })}
        </div>
      </div>
    );
  };

  private _buildRow = (
    colorRow: ColorComponent[],
    pixelRowNumber: number
  ): JSX.Element => {
    const pixelStyle: React.CSSProperties = {
      display: "inline-block",
      fontSize: "small",
      color: "rgba(100, 100, 100, 255)",
      marginRight: "4px"
    };

    const pixelRow: JSX.Element[] = [];

    let colNumber: number = 0;
    colorRow.forEach(color => {
      const pixelElement = (
        <a
          style={{
            ...pixelStyle
          }}
          key={`${pixelRowNumber}-${colNumber}`}
          onClick={this._hoverPixelElement}
          data-row-number={`${pixelRowNumber}`}
          data-col-number={`${colNumber}`}
          data-component={`${JSON.stringify(color)}`}
        >
          {`${byteValue2HexString(colNumber)}`}
        </a>
      );
      pixelRow.push(pixelElement);

      colNumber++;
    });

    return <div>{pixelRow}</div>;
  };

  private _hoverPixelElement = (event: React.MouseEvent): void => {
    const el = event.currentTarget as HTMLAnchorElement;
    this.setState({
      activeComponent: { ...JSON.parse(el.dataset["component"]) }
    });
  };

  private _buildRgbString = (color: ColorComponent): string => {
    return `rgba(${color.r}, ${color.g}, ${color.b})`;
  };
}

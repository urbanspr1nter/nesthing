import "bulma/css/bulma.css";
import React from "react";
import * as ColorPalette from "../utils/colors.json";
import { buildRgbString } from "../utils/ui/utils";
import { ColorComponent } from "../ppu/ppu";

const palette: { [key: string]: ColorComponent } = ColorPalette;

export default class Palette extends React.Component<{}, {}> {
  constructor(props: any) {
    super(props);
  }

  public render = (): JSX.Element => {
    return this._buildPalette();
  };

  private _buildPalette = (): JSX.Element => {
    const color: JSX.Element[] = [];
    console.log(palette.default);
    for (let k in ColorPalette) {
      const currColor: ColorComponent = palette[k];
      const colorStyle: React.CSSProperties = {
        width: "32px",
        height: "32px",
        display: "inline-block",
        border: "1px solid black",
        backgroundColor: buildRgbString(currColor)
      };
      color.push(<div style={colorStyle} />);
    }
    return <div>{color}</div>;
  };
}

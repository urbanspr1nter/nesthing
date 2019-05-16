import React from "react";
import { PpuRegisters } from "../nes/nes";
import { shortValue2HexString, byteValue2HexString } from "../utils/ui/utils";

interface PpuRegisterViewProps {
  data: PpuRegisters;
}

export default class PpuRegisterView extends React.PureComponent<
  PpuRegisterViewProps,
  {}
> {
  constructor(props: PpuRegisterViewProps) {
    super(props);
  }

  public render = (): JSX.Element => {
    const containerStyle: React.CSSProperties = {
      padding: "8px",
      display: "inline-block",
      maxWidth: "320px",
      fontSize: "small",
      textAlign: "left",
      borderTop: "1px solid rgb(200, 200, 200)",
      marginTop: "8px"
    };

    const columnsStyle: React.CSSProperties = {
      maxWidth: "320px"
    };

    const fieldBodyStyle: React.CSSProperties = {
      backgroundColor: "rgb(242, 242, 242)",
      padding: "4px",
      maxWidth: "40px",
      maxHeight: "30px",
      fontFamily: "Monospace",
      fontSize: "medium"
    };

    return (
      <div className="container" style={containerStyle}>
        <h6 className="title is-6">PPU Registers</h6>
        <div className="container">
          <div className="columns" style={columnsStyle}>
            <div className="column">
              <div className="field is-horizontal">
                <div className="field field-label">
                  <label className="label is-small">V</label>
                </div>
                <div className="field field-body" style={fieldBodyStyle}>
                  {shortValue2HexString(this.props.data.v)}
                </div>
              </div>
            </div>
            <div className="column">
              <div className="field is-horizontal">
                <div className="field field-label">
                  <label className="label is-small">T</label>
                </div>
                <div className="field field-body" style={fieldBodyStyle}>
                  {shortValue2HexString(this.props.data.t)}
                </div>
              </div>
            </div>
            <div className="column">
              <div className="field is-horizontal">
                <div className="field field-label">
                  <label className="label is-small">FLAG</label>
                </div>
                <div className="field field-body" style={fieldBodyStyle}>
                  {this.props.data.w ? "1" : "0"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
}

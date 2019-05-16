import React from "react";
import { CpuRegisters } from "../nes/nes";
import { byteValue2HexString, shortValue2HexString } from "../utils/ui/utils";

interface CpuRegisterViewProps {
  data: CpuRegisters;
}

export default class CpuRegisterView extends React.Component<
  CpuRegisterViewProps,
  {}
> {
  constructor(props: CpuRegisterViewProps) {
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
        <h6 className="title is-6">CPU Registers</h6>
        <div className="container">
          <div className="columns" style={columnsStyle}>
            <div className="column">
              <div className="field is-horizontal">
                <div className="field field-label">
                  <label className="label is-small">A</label>
                </div>
                <div className="field field-body" style={fieldBodyStyle}>
                  {byteValue2HexString(this.props.data.a)}
                </div>
              </div>
            </div>
            <div className="column">
              <div className="field is-horizontal">
                <div className="field field-label">
                  <label className="label is-small">X</label>
                </div>
                <div className="field field-body" style={fieldBodyStyle}>
                  {byteValue2HexString(this.props.data.x)}
                </div>
              </div>
            </div>
            <div className="column">
              <div className="field is-horizontal">
                <div className="field field-label">
                  <label className="label is-small">Y</label>
                </div>
                <div className="field field-body" style={fieldBodyStyle}>
                  {byteValue2HexString(this.props.data.y)}
                </div>
              </div>
            </div>
          </div>
          <div className="columns" style={columnsStyle}>
            <div className="column">
              <div className="field is-horizontal">
                <div className="field field-label">
                  <label className="label is-small">PC</label>
                </div>
                <div className="field field-body" style={fieldBodyStyle}>
                  {byteValue2HexString(this.props.data.pc)}
                </div>
              </div>
            </div>
            <div className="column">
              <div className="field is-horizontal">
                <div className="field field-label">
                  <label className="label is-small">SP</label>
                </div>
                <div className="field field-body" style={fieldBodyStyle}>
                  {shortValue2HexString(this.props.data.sp)}
                </div>
              </div>
            </div>
            <div className="column">
              <div className="field is-horizontal">
                <div className="field field-label">
                  <label className="label is-small">P</label>
                </div>
                <div className="field field-body" style={fieldBodyStyle}>
                  {byteValue2HexString(this.props.data.p)}
                </div>
              </div>{" "}
            </div>
          </div>
        </div>
      </div>
    );
  };
}

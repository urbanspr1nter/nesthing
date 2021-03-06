import * as React from "react";

require("./ButtonMappingInfo.css");

export interface ButtonMappingInfoProps {
  visible: boolean;
  onToggle: () => void;
}

const styles = {
  container: {
    marginBottom: 8,
    display: "inline-flex"
  } as React.CSSProperties,
  table: {
    border: "1px dotted #888888",
    borderCollapse: "collapse"
  } as React.CSSProperties
};

export const ButtonMappingInfo: React.FunctionComponent<
  ButtonMappingInfoProps
> = (props: ButtonMappingInfoProps) => {
  const { visible, onToggle } = props;

  let buttonKeymapLabel = "Show Key Map";

  let button = (
    <button type="button" className="button is-link" onClick={onToggle}>
      {buttonKeymapLabel}
    </button>
  );

  if (!visible) {
    return <div className="button-mapping-info-container">{button}</div>;
  } else {
    buttonKeymapLabel = "Hide Key Map";
    button = (
      <button type="button" className="button is-light" onClick={onToggle}>
        {buttonKeymapLabel}
      </button>
    );
  }

  return (
    <div className="button-mapping-info-container" style={styles.container}>
      <div>
        {button}
      </div>
      <div>
        <strong>Player 1: Keyboard Mapping</strong>
        <table className="button-mapping-info-table" style={styles.table}>
          <tr>
            <td>START</td>
            <td>Enter</td>
          </tr>
          <tr>
            <td>SELECT</td>
            <td>Shift</td>
          </tr>
          <tr>
            <td>Up, Left, Down, Right</td>
            <td>W, A, S, D</td>
          </tr>
          <tr>
            <td>A, B</td>
            <td>K, J</td>
          </tr>
        </table>
        <strong>Player 2: Keyboard Mapping</strong>
        <table className="button-mapping-info-table" style={styles.table}>
          <tr>
            <td>START</td>
            <td>/</td>
          </tr>
          <tr>
            <td>SELECT</td>
            <td>.</td>
          </tr>
          <tr>
            <td>A, B</td>
            <td>m, , </td>
          </tr>
          <tr>
            <td>Up, Left, Down, Right</td>
            <td>ArrowUp, ArrowLeft, ArrowDown, ArrowRight</td>
          </tr>
        </table>
      </div>
      <div>
        <strong>Player 1: XBOX 360 Controller Mapping</strong>
        <table className="button-mapping-info-table">
          <tr>
            <td>START</td>
            <td>Start</td>
          </tr>
          <tr>
            <td>SELECT</td>
            <td>Select</td>
          </tr>
          <tr>
            <td>Up, Left, Down, Right</td>
            <td>DPad-Up, DPad-Left, DPad-Down, DPad-Right</td>
          </tr>
          <tr>
            <td>A, B</td>
            <td>A, X</td>
          </tr>
        </table>
        <strong>Player 2: XBOX 360 Controller Mapping</strong>
        <table className="button-mapping-info-table">
          <tr>
            <td>START</td>
            <td>Start</td>
          </tr>
          <tr>
            <td>SELECT</td>
            <td>Select</td>
          </tr>
          <tr>
            <td>Up, Left, Down, Right</td>
            <td>DPad-Up, DPad-Left, DPad-Down, DPad-Right</td>
          </tr>
          <tr>
            <td>A, B</td>
            <td>A, X</td>
          </tr>
        </table>
      </div>
    </div>
  );
};

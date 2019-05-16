import React from "react";

export default class MainTitle extends React.PureComponent<{}, {}> {
  constructor(props: any) {
    super(props);
  }

  public render = (): JSX.Element => {
    const titleStyle: React.CSSProperties = {
      margin: "32px"
    };

    return (
      <div className="container" style={titleStyle}>
        <h4 className="title is-4">Visual NES</h4>
        <h6 className="subtitle is-6">Roger Ngo, urbanspr1nter [at] gmail.com, rogerngo.com</h6>
      </div>
    );
  };
}

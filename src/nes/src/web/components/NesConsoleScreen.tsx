import * as React from "react";

require("./NesConsoleScreen.css");

export default class NesConsoleScreen extends React.Component {
    constructor(props) {
        super(props);
    }

    public render() {
        return (
            <div className="nes-console">
                <canvas id="main" width="256" height="240"></canvas>
            </div>
        );
    }
}
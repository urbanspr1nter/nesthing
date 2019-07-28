import * as React from "react";

require("./NesConsoleScreen.css");

export default class NesConsoleScreen extends React.Component {
    constructor(props) {
        super(props);
    }

    public render() {
        return (
            <div className="nes-console">
                <div id="nes-console-fps">0</div>
                <canvas id="main" width="256" height="240"></canvas>
            </div>
        );
    }
}
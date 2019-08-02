import React from "react";

require("./NesNetPlay.css");

export interface NesNetPlayProps {
    id: string;
}

export interface NesNetPlayState {
}

export default class NesNetPlay extends React.PureComponent<NesNetPlayProps, NesNetPlayState> {
    constructor(props: NesNetPlayProps) {
        super(props);
    }

    public render() {
        const {  id } = this.props;

        return (
            <div className="nes-netplay-container">
                <label>NetPlay ID</label>
                <label className="connection-id">
                    { id }
                </label>
                <div className="tags has-addons">
                    <span className="tag is-danger">Player 1</span>
                    <span className="tag is-light">Player 2</span>
                </div>
                <div className="field">
                    <div className="control">
                        <input className="input is-small" type="text" placeholder="Connect to Player" />
                        <button className="button is-small is-link">Connect</button>
                        <button className="button is-small is-light">Ping</button>
                    </div>
                </div>
            </div>
        );
    }
}
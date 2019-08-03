import React from "react";

require("./NesNetPlay.css");

export interface NesNetPlayProps {
  id: string;
  netplayPeerId: string;
  onConnectClick: () => void;
  onPingClick: () => void;
  onNetplayPeerIdChange: () => void;
}

export interface NesNetPlayState {}

export default class NesNetPlay extends React.PureComponent<
  NesNetPlayProps,
  NesNetPlayState
> {
  constructor(props: NesNetPlayProps) {
    super(props);
  }

  public render() {
    const {
      id,
      onPingClick,
      onConnectClick,
      netplayPeerId,
      onNetplayPeerIdChange
    } = this.props;

    return (
      <div className="nes-netplay-container">
        <label>NetPlay ID</label>
        <label className="connection-id">{id}</label>
        <div className="tags has-addons">
          <span className="tag is-danger">Player 1</span>
          <span className="tag is-light">Player 2</span>
        </div>
        <div className="field">
          <div className="control">
            <input
              className="input is-small"
              type="text"
              placeholder="Connect to Player"
              onChange={onNetplayPeerIdChange}
              value={netplayPeerId}
            />
            <button
              className="button is-small is-link"
              onClick={onConnectClick}
            >
              <i className="fas fa-wifi" />
              Connect
            </button>
            <button className="button is-small is-light" onClick={onPingClick}>
              Ping
            </button>
          </div>
        </div>
      </div>
    );
  }
}

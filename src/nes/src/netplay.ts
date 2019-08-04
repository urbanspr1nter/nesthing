import Peer from "peerjs";
import {v4 as uuid} from "uuid";

export enum NetPlayStatus {
    Inactive = "Inactive",
    Waiting = "Waiting",
    Active = "Active"
}

export default class NetPlay {
    private _peer: Peer;
    private _connection: Peer.DataConnection;
    private _thisPeerId: string;
    private _thatPeerId: string;
    private _thatPeerConnected: boolean;

    constructor() {
        this._thisPeerId = uuid();
        this._thatPeerId = null;
        this._connection = null;
        this._thatPeerConnected = null;

        this._peer = new Peer(this._thisPeerId);
        this._peer.on("open", () => {
            console.log(`Connection opened. ${this._thisPeerId}`);
        });

        // Handle incoming data from others.
        this._peer.on("connection", (connection: any) => {
            if(this._connection && this._connection.peer === connection.peer) {
                this._thatPeerConnected = true;
            }
            connection.on("data", (data: any) => {
                console.log(`Payload ${data}`);
                if(data.indexOf("ping") !== -1) {
                    connection.send(`${this._thatPeerId} :: pong`);
                } else {
                    // Save state payload
                }                
            });
        });
    }

    get id() {
        return this._thisPeerId;
    }

    get peerId() {
        return this._thatPeerId;
    }

    get status() {
        if(!this._thisPeerId || !this._thatPeerId || !this._thatPeerConnected) {
            return NetPlayStatus.Waiting;
        }
        if(this._thisPeerId && this._thatPeerId && this._thatPeerConnected) {
            return NetPlayStatus.Active;
        }

        return NetPlayStatus.Inactive;
    }

    public connect(destPeerId: string): Peer.DataConnection {
        this._thatPeerId = destPeerId;

        this._connection = this._peer.connect(this._thatPeerId, { reliable: true });

        return this._connection;
    }

    public ping() {
        this._connection.send(`${this._thisPeerId} :: ping`);
    }

    public send(data: string) {
        this._connection.send(data);
    }
}
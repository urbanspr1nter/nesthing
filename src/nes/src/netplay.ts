import { v4 as uuid } from "uuid";
import io from "socket.io-client";
import { NesConsole } from "./nesconsole";

const SERVER_PING_INTERVAL = 20000;
const SERVER_ENDPOINT = "http://localhost:3000";

enum NetPlayEvents {
  Ping = "pingy",
  Pong = "pongy",
  StreamState = "stream-state",
  ReceiveState = "receive-state"
}
export default class NetPlay {
  private _clientId: string;
  private _ioSocket: SocketIOClient.Socket;
  private _pingInterval: NodeJS.Timer;

  constructor(nesConsole: NesConsole) {
    this._clientId = uuid();

    this._ioSocket = io(SERVER_ENDPOINT);
    this._ioSocket.on("connect", () => {
      this._ioSocket.on("receive-state", (data: any) => {
          if(data.clientId === this._clientId) {
              return;
          }
        nesConsole.load(data.payload);
        console.log(data);
      });

      this._ioSocket.on("pongy", () => {
        console.log("PONG!");
      });

      this._pingInterval = setInterval(
        this.ping.bind(this),
        SERVER_PING_INTERVAL
      );
    });

    this._ioSocket.on("disconnect", () => {
      clearInterval(this._pingInterval);
      this._ioSocket.connect();
    });
  }

  public ping() {
    this._ioSocket.emit(NetPlayEvents.Ping, { clientId: this._clientId });
  }

  public stream(payload: string) {
    this._ioSocket.emit("stream-state", {clientId: this._clientId, payload: JSON.parse(payload)});
  }
}

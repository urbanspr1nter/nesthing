const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const NetPlayEvents = {
    StreamState: "stream-state",
    ReceiveState: "receive-state"
};

server.listen(3000, () => {
    console.log("Listening on port 3000");
});

io.on("connection", (socket) => {
    console.log("User connected.");
    socket.on("pingy", (event) => {
        socket.emit("pongy");
    });

    socket.on(NetPlayEvents.StreamState, (event) => {
        io.emit(NetPlayEvents.ReceiveState, event);
    });
});

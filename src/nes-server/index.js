const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

server.listen(3000, () => {
    console.log("Listening on port 3000");
});

io.on("connection", (socket) => {
    console.log("User connected aaa");
    socket.on("pingy", (event) => {
        console.log("ping!", event);
        socket.emit("pongy");
    });
});

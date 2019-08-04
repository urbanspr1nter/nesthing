const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.get("/", (req, res) => {
    res.status(200).send("It works!");
});

io.on("connection", (socket) => {
    console.log("User connected");
    socket.on("ping", (name, fn) => {
        console.log("ping!");
        fn("pong");
    });
});

http.listen(3000, () => {
    console.log("Listening on port 3000");
});
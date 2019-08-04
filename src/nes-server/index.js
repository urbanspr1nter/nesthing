const app = require("express")();
const http = require("http").createServer(app);

app.get("/", (req, res) => {
    res.status(200).send("It works!");
});

http.listen(3000, () => {
    console.log("Listening on port 3000");
});
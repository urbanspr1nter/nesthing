const express = require("express");
const app = express();

app.use(express.static('./'));

app.listen(8500, function() {
    console.log("working");
});
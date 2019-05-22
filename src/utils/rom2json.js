"use strict";
exports.__esModule = true;
var fs = require("fs");
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */
var bytes = [];
var romContents = fs.readFileSync('../nes/MARIO.nes');
romContents.forEach(function (value) {
    bytes.push(value);
});
var result = {
    name: 'MARIO.nes',
    raw: bytes
};
fs.writeFileSync('../nes/mario.json', JSON.stringify(result));

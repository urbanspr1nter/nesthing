"use strict";
exports.__esModule = true;
exports.prettifyMemory = function (memoryArray) {
    var data = [];
    for (var i = 0; i < memoryArray.length; i++) {
        var converted = memoryArray[i].toString(16).toUpperCase();
        if (converted.length < 2) {
            data.push("0" + converted);
        }
        else {
            data.push(converted);
        }
    }
    return data;
};
exports.byteValue2HexString = function (byteValue) {
    var hex = byteValue.toString(16).toUpperCase();
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};
exports.shortValue2HexString = function (byteValue) {
    var hex = byteValue.toString(16).toUpperCase();
    while (hex.length < 4) {
        hex = "0" + hex;
    }
    return hex;
};
exports.buildRgbString = function (color) {
    return "rgba(" + color.r + ", " + color.g + ", " + color.b + ")";
};

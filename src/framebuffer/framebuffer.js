"use strict";
exports.__esModule = true;
var ColorPalette = require("../utils/colors.json");
exports.NesPpuPalette = ColorPalette;
var TOTAL_SCANLINES = 240;
var TOTAL_DOTS = 256;
var DEFAULT_COLOR = { r: 0, g: 0, b: 192 };
var FrameBuffer = /** @class */ (function () {
    function FrameBuffer() {
        this._initializeFrameBuffer();
    }
    FrameBuffer.prototype.buffer = function () {
        return this._frameBuffer;
    };
    FrameBuffer.prototype.draw = function (row, column, color) {
        if (!this._frameBuffer[row]) {
            return;
        }
        this._frameBuffer[row][column] = color;
    };
    FrameBuffer.prototype.getColor = function (colorByte) {
        return exports.NesPpuPalette[colorByte];
    };
    /**
     * Initializes the frame buffer.
     *
     * This will store the representation of the screen.
     *
     * Since the resolution is 256x240 for the NES, we have
     * decided to use a 2D array of 256 rows, and 240 columns.
     *
     * Each element represents a single pixel.
     */
    FrameBuffer.prototype._initializeFrameBuffer = function () {
        this._frameBuffer = [];
        for (var i = 0; i < TOTAL_SCANLINES; i++) {
            this._frameBuffer.push([]);
            for (var j = 0; j < TOTAL_DOTS; j++) {
                this._frameBuffer[i].push(DEFAULT_COLOR);
            }
        }
    };
    return FrameBuffer;
}());
exports.FrameBuffer = FrameBuffer;

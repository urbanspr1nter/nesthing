"use strict";
exports.__esModule = true;
exports.BaseNametableAddresses = {
    0x00: 0x2000,
    0x01: 0x2400,
    0x02: 0x2800,
    0x03: 0x2C00
};
var PpuRegister;
(function (PpuRegister) {
    PpuRegister[PpuRegister["PPUCTRL"] = 8192] = "PPUCTRL";
    PpuRegister[PpuRegister["PPUMASK"] = 8193] = "PPUMASK";
    PpuRegister[PpuRegister["PPUSTATUS"] = 8194] = "PPUSTATUS";
    PpuRegister[PpuRegister["OAMADDR"] = 8195] = "OAMADDR";
    PpuRegister[PpuRegister["OAMDATA"] = 8196] = "OAMDATA";
    PpuRegister[PpuRegister["PPUSCROLL"] = 8197] = "PPUSCROLL";
    PpuRegister[PpuRegister["PPUADDR"] = 8198] = "PPUADDR";
    PpuRegister[PpuRegister["PPUDATA"] = 8199] = "PPUDATA";
    PpuRegister[PpuRegister["OAMDMA"] = 16404] = "OAMDMA";
})(PpuRegister = exports.PpuRegister || (exports.PpuRegister = {}));
;

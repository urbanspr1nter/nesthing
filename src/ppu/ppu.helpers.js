"use strict";
exports.__esModule = true;
function getBaseNametableAddress(reg$2000) {
    var base = reg$2000 & 0x03;
    switch (base) {
        case 0x00:
            return 0x2000;
        case 0x01:
            return 0x2400;
        case 0x02:
            return 0x2800;
        case 0x03:
            return 0x2C00;
    }
    return 0x2000;
}
exports.getBaseNametableAddress = getBaseNametableAddress;

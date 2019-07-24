#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

uint8_t oam[64];

void sprite_evaluateSprites(uint8_t regPPUCTR_spriteSizeLarge) {
    int height;
    int oamIndex;

    if(regPPUCTR_spriteSizeLarge != 0) {
        height = 16;
    } else {
        height = 8;
    }

    for(oamIndex = 0; i < oamIndex < 64; oamIndex++) {
        int oamBaseIndex = oamIndex << 2;
        int y = oam[oamBaseIndex];
        int attribute = 0; 
    }
    
}
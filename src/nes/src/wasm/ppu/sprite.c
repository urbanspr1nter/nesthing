#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

typedef struct SpriteData {
    uint8_t Data;
    uint32_t PositionX;
    uint32_t Priority;
    uint8_t BaseOamAddress;
} SpriteData;

SpriteData sprite_spriteData[8]; // for now

const uint8_t SPRITE_OVERFLOW = 1;
const uint8_t SPRITE_WITHIN_RANGE = 0;
const uint8_t PPU_MAX_SPRITES_PER_SCANLINE = 8;

uint8_t sprite_spriteCount; 
uint8_t sprite_oam[64];

uint32_t sprite_fetchSpritePattern(uint8_t baseOamAddress, uint32_t row, uint8_t regPPUCTRL_spriteSizeLarge, uint32_t regPPUCTRL_spritePatternTableAddress) {
    uint8_t oamIndex = baseOamAddress << 2;
    uint8_t tileByte = sprite_oam[oamIndex + 1];
    uint8_t attributes = sprite_oam[oamIndex + 2];

    uint16_t address = 0;
    if(regPPUCTRL_spriteSizeLarge == 0) {
        if((attributes & 0x80) == 0x80) {
            row = 7 - row;
        }

        uint16_t baseTableMultiplier = regPPUCTRL_spritePatternTableAddress == 0x1000 ? 1 : 0;
        address = baseTableMultiplier * 0x1000 + (tileByte << 4) + row;  
    } else {
        if((attributes & 0x80) == 0x80) {
            row = 15 - row;
        }

        uint16_t baseTableMultiplier = tileByte & 1;
        tileByte &= 0xFE;

        if(row > 7) {
            tileByte++;
            row -= 8;
        }

        address = baseTableMultiplier * 0x1000 + (tileByte << 4) + row;
    }

    uint8_t lowTileByte = 0; // ppuMemory.get(address);
    uint8_t highTileByte = 0; // ppuMemory.get(address + 8);

    uint32_t data = 0;

    uint8_t attributePalette = (attributes & 3) << 2;
    int spriteCount;
    for(spriteCount = 0; spriteCount < 8; spriteCount++) {
        uint8_t p1;
        uint8_t p2;

        if((attributes & 0x40) == 0x40) {
            p1 = lowTileByte & 1;
            p2 = (highTileByte & 1) << 1;

            lowTileByte >>= 1;
            highTileByte >>= 1;
        } else {
            p1 = (lowTileByte & 0x80) >> 7;
            p2 = (lowTileByte & 0x80) >> 6;

            lowTileByte <<= 1;
            highTileByte <<= 1;
        }

        data <<= 4;
        data = data | (attributePalette | p2 | p1);
    }

    return data;
}

uint8_t sprite_evaluateSprites(uint8_t regPPUCTRL_spriteSizeLarge, uint32_t regPPUCTRL_spritePatternTableAddress, uint32_t scanlines) {
    uint32_t height;
    uint8_t spriteCount;
    uint32_t oamIndex;

    if(regPPUCTRL_spriteSizeLarge == 0) {
        height = 8;
    } else {
        height = 16;
    }

    for(oamIndex = 0; oamIndex < 64; oamIndex++) {
        uint8_t oamBaseIndex = oamIndex << 2;
        uint8_t y = sprite_oam[oamBaseIndex];
        uint8_t attribute = sprite_oam[oamBaseIndex + 2];
        uint8_t x = sprite_oam[oamBaseIndex + 3];

        uint32_t row = scanlines - y;

        if(row < 0 || row >= height) {
            continue;
        }

        if(spriteCount < 8) {
            sprite_spriteData[spriteCount].Data = sprite_fetchSpritePattern(oamIndex, row, regPPUCTRL_spriteSizeLarge, regPPUCTRL_spritePatternTableAddress);
            sprite_spriteData[spriteCount].PositionX = x;
            sprite_spriteData[spriteCount].Priority = (attribute >> 5) & 1;
            sprite_spriteData[spriteCount].BaseOamAddress = oamIndex;
        }

        spriteCount++;
    }

    uint8_t result = SPRITE_WITHIN_RANGE;
    if(spriteCount > PPU_MAX_SPRITES_PER_SCANLINE) {
        spriteCount = PPU_MAX_SPRITES_PER_SCANLINE;
        result = SPRITE_OVERFLOW; 
    }  

    sprite_spriteCount = spriteCount;

    return result;
}

int main(int argc, char **argv) {
    printf("it works\n");
}
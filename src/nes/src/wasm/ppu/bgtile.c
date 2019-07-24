#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

typedef struct BgTile {
    uint32_t high32;
    uint32_t low32;
} BgTile;

BgTile *backgroundTile;

int bgTile_test() {
    return 999;
}

void bgTile_init() {
    backgroundTile = malloc(sizeof(BgTile));
}

void bgTile_shiftLeft4() {
    backgroundTile->high32 <<= 4;
    backgroundTile->high32 = backgroundTile->high32 
        | ((backgroundTile->low32 >> 28) & 0xf);
    backgroundTile->low32 <<= 4;
}

uint32_t bgTile_getHigh32() {
    return backgroundTile->high32;
}

uint32_t bgTile_getLow32() {
    return backgroundTile->low32;
}

uint8_t bgTile_getPixel(uint8_t regPPUSCROLL_x) {
    return (backgroundTile->high32 >> ((7 - regPPUSCROLL_x) << 2)) & 0x0f;
}

void bgTile_setLow32(uint32_t value) {
    backgroundTile->low32 = value;
}

void bgTile_setHigh32(uint32_t value) {
    backgroundTile->high32 = value;
}

int main(int argc, char **argv) {
    bgTile_init();

    backgroundTile->high32 = 0xf0f0f0f0;
    backgroundTile->low32 = 0xf0f0f0f0;

    printf("hi: %u, lo: %u\n", bgTile_getHigh32(), bgTile_getLow32());

    bgTile_shiftLeft4();
    printf("hi: %u, lo: %u\n", bgTile_getHigh32(), bgTile_getLow32());

    bgTile_shiftLeft4();
    printf("hi: %u, lo: %u\n", bgTile_getHigh32(), bgTile_getLow32());

    bgTile_shiftLeft4();
    printf("hi: %u, lo: %u\n", bgTile_getHigh32(), bgTile_getLow32());

    bgTile_shiftLeft4();
    printf("hi: %u, lo: %u\n", bgTile_getHigh32(), bgTile_getLow32());

    bgTile_shiftLeft4();
    printf("hi: %u, lo: %u\n", bgTile_getHigh32(), bgTile_getLow32());

    bgTile_shiftLeft4();
    printf("hi: %u, lo: %u\n", bgTile_getHigh32(), bgTile_getLow32());

    bgTile_shiftLeft4();
    printf("hi: %u, lo: %u\n", bgTile_getHigh32(), bgTile_getLow32());

    bgTile_setLow32(0xf0f0f0f0);
    printf("hi: %u, lo: %u\n", bgTile_getHigh32(), bgTile_getLow32());
}
/*
    passfilters.c

    Roger Ngo
*/

#include <stdio.h>
#include <stdlib.h>
#include <math.h>

typedef struct FirstOrderFilter {
    float B0;
    float B1;
    float A1;
    float PrevX;
    float PrevY;
} FirstOrderFilter;

int FILTER_COUNT = 3;
int chainIdx;
FirstOrderFilter filters[FILTER_COUNT];

/*
    A test function to see if everything is working correctly.
*/
int test() {
    return 999;
}

FirstOrderFilter *lowPassFilter(int sampleRate, int cutoffFrequency) {
    FirstOrderFilter *f = malloc(sizeof(FirstOrderFilter));

    float c = sampleRate / M_PI / cutoffFrequency;
    float a0i = 1 / (1 + c);

    f->B0 = a0i;
    f->B1 = a0i;
    f->A1 = (1 - c) * a0i;
    f->PrevX = 0;
    f->PrevY = 0;

    return f;
}

FirstOrderFilter *highPassFilter(int sampleRate, int cutoffFrequency) {
    FirstOrderFilter *f = malloc(sizeof(FirstOrderFilter));

    float c = sampleRate / M_PI / cutoffFrequency;
    float a0i = 1 / (1 + c);

    f->B0 = c * a0i;
    f->B1 = -c * a0i;
    f->A1 = (1 - c) * a0i;
    f->PrevX = 0;
    f->PrevY = 0;

    return f;
}

void addFilterToChain(FirstOrderFilter *f) {
    filters[chainIdx++] = *f;
}

float step(float x, FirstOrderFilter *f) {
    float y = (f->B0 * x) + (f->B1 * f->PrevX) - (f->A1 * f->PrevY);

    f->PrevY = y;
    f->PrevX = x;

    return y;
}

float runFilterChains(float x) {
    int i;
    float workingX = x;

    for(i = 0; i < FILTER_COUNT; i++) {
        FirstOrderFilter *f = &filters[i];
        
        workingX = step(workingX, f);
    }

    return workingX;
}

/*
    Use this to test.
*/
int main(int argc, char **argv) {
    FirstOrderFilter *highPassFilter1 = highPassFilter(44100, 90);
    FirstOrderFilter *highPassFilter2 = highPassFilter(44100, 440);
    FirstOrderFilter *lowPassFilter1 = lowPassFilter(44100, 14000);
    
    addFilterToChain(highPassFilter1);
    addFilterToChain(highPassFilter2);
    addFilterToChain(lowPassFilter1);

    float result = runFilterChains(5);

    printf("%f \n", result);

    return 0;
}
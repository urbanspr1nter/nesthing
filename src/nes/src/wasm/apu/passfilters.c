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

const int FILTER_COUNT = 3;
int chainIdx;
FirstOrderFilter filters[FILTER_COUNT];

/*
    A test function to see if everything is working correctly.
*/
int pf_test() {
    return 999;
}

FirstOrderFilter *pf_lowPassFilter(int sampleRate, int cutoffFrequency) {
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

FirstOrderFilter *pf_highPassFilter(int sampleRate, int cutoffFrequency) {
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

void pf_addFilterToChain(FirstOrderFilter *f) {
    filters[chainIdx++] = *f;

    /* 
        Ensure that the list of filters circles back to the beginning if another filter has been added. 
        We only support max=3.
    */
    if(chainIdx >= FILTER_COUNT) {
        chainIdx = 0;
    }
}

float pf_step(float x, FirstOrderFilter *f) {
    float y = (f->B0 * x) + (f->B1 * f->PrevX) - (f->A1 * f->PrevY);

    f->PrevY = y;
    f->PrevX = x;

    return y;
}

float pf_runFilterChains(float x) {
    int i;
    float workingX = x;

    for(i = 0; i < FILTER_COUNT; i++) {
        FirstOrderFilter *f = &filters[i];
        
        workingX = pf_step(workingX, f);
    }

    return workingX;
}

/*
    Use this to test.
*/
int _main(int argc, char **argv) {
    FirstOrderFilter *highPassFilter1 = pf_highPassFilter(44100, 90);
    FirstOrderFilter *highPassFilter2 = pf_highPassFilter(44100, 440);
    FirstOrderFilter *lowPassFilter1 = pf_lowPassFilter(44100, 14000);
    
    pf_addFilterToChain(highPassFilter1);
    pf_addFilterToChain(highPassFilter2);
    pf_addFilterToChain(lowPassFilter1);

    float result = pf_runFilterChains(5);

    printf("%f \n", result);

    return 0;
}
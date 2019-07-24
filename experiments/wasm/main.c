#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int MAX_SIZE = 1000000;
int MAX_RUNS = 1000;
int arr[MAX_SIZE];

float benchmark() {
    int i, j;
    float seconds;
    clock_t t;

    srand(time(0));

    t = clock();
    for(i = 0; i < MAX_RUNS; i++) {
        for(j = 0; j < MAX_SIZE; j++) {
            arr[j] = rand();
        }
    }
    t = clock() - t;

    seconds = ((float)t) / CLOCKS_PER_SEC;

    return seconds;
}

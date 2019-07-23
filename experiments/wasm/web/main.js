const MAX_SIZE = 1000000;
const MAX_RUNS = 1000;

function main() {
    const arr = [];
    for(let i = 0; i < MAX_SIZE; i++) {
        arr[i] = 0;
    }

    const t = performance.now();
    for(let i = 0; i < MAX_RUNS; i++) {
        for(let j = 0; j < MAX_SIZE; j++) {
            arr[j] = Math.random();
        }
    }
    const seconds = (performance.now() - t) / 1000;

    document.getElementById("result").innerHTML 
        = `${seconds} seconds to complete`;
}

main();
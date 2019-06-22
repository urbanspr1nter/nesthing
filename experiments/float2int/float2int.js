var NUMBER_OF_FLOATS = 32_000_000;

function generateRandoms() {
    var randomFloats = [];
    
    for(let i = 0; i < NUMBER_OF_FLOATS; i++) {
        randomFloats.push(Math.random() * 100);
    }

    return randomFloats;
}

function mathTruncBench() {
    var randomFloats = generateRandoms();
    var integers = [];

    var startTime = performance.now();
    for(let i = 0; i < randomFloats.length; i++) {
        integers.push(Math.trunc(randomFloats[i]));
    }
    var endTime = performance.now() - startTime;

    return endTime;
}

function orConvertBench() {
    var randomFloats = generateRandoms();
    var integers = [];

    var startTime = performance.now();
    for(let i = 0; i < randomFloats.length; i++) {
        integers.push(randomFloats[i] | 0);
    }
    var endTime = performance.now() - startTime;

    return endTime;
}

document.getElementById("bench-math-trunc").addEventListener("click", function run() { 
    var times = [];
    var sum = 0;

    for(let i = 0; i < 10; i++) {
        document.getElementById("result-math-trunc").innerHTML 
            = `Running Test ${i}/10`;

        var time = mathTruncBench();
        times.push(time);

        sum += time;
    }

    document.getElementById("result-math-trunc").innerHTML 
        = `Math.trunc: ${sum} ms.`;
});

document.getElementById("bench-bitwise-or").addEventListener("click", function run() {
    var times = [];
    var sum = 0;

    for(let i = 0; i < 10; i++) {
        document.getElementById("result-bitwise-or").innerHTML 
            = `Running Test ${i}/10`;

        var time = orConvertBench();
        times.push(time);

        sum += time;
    }

    document.getElementById("result-bitwise-or").innerHTML 
        = `Bitwise OR Trick: ${sum} ms.`;
});

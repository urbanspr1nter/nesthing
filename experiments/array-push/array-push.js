var MAX_SIZE = 100000;
var TOTAL_RUNS = 1000;
var arr = [];
var currIdx = 0;

function setup() {
  arr = [];
  currIdx = 0;
}

function pushTest() {
  if (arr.length === MAX_SIZE) {
    arr = [];
  }

  for (let i = 0; i < MAX_SIZE; i++) {
    arr.push(Math.random());
  }
}

function setupIndex() {
  for (let i = 0; i < MAX_SIZE; i++) {
    arr[i] = 0;
  }
}

function indexTest() {
  if (currIdx === MAX_SIZE) {
    currIdx = 0;
  }
  for (let i = 0; i < MAX_SIZE; i++) {
    arr[currIdx++] = Math.random();
  }
}

function runExperiment1() {
  document.getElementById("results-exp-1").innerHTML =
    "Running experiment 1...";

  window.setTimeout(function() {
    var start = performance.now();
    for (let i = 0; i < TOTAL_RUNS; i++) {
      pushTest();
    }

    document.getElementById(
      "results-exp-1"
    ).innerHTML = `${MAX_SIZE} elements pushed for ${TOTAL_RUNS} runs: <strong>${(
      performance.now() - start
    ).toFixed(4)} ms</strong>`;
  }, 1000);
}

function runExperiment2() {
  document.getElementById("results-exp-2").innerHTML =
    "Running experiment 2...";

  window.setTimeout(function() {
    setupIndex();

    start = performance.now();
    for (let i = 0; i < TOTAL_RUNS; i++) {
      indexTest();
    }

    document.getElementById(
      "results-exp-2"
    ).innerHTML = `${MAX_SIZE} elements pushed for ${TOTAL_RUNS} runs: <strong>${(
      performance.now() - start
    ).toFixed(4)} ms</strong>`;
  }, 1000);
}

document.getElementById("btn-exp-1").addEventListener("click", runExperiment1);
document.getElementById("btn-exp-2").addEventListener("click", runExperiment2);

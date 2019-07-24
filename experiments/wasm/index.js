Module.onRuntimeInitialized = function onModuleInitialized() {
  document.getElementById("btn-wasm").classList.remove("disabled");
  document.getElementById("btn-wasm").innerHTML = `Run WASM Test`;
  document
    .getElementById("btn-wasm")
    .addEventListener("click", function onWasmClicked() {
      document.getElementById("btn-wasm").classList.add("disabled");

      document.getElementById("wasm-result").innerHTML = `Running WASM test...`;

      setTimeout(function() {
        var result = Module._benchmark();

        document.getElementById(
          "wasm-result"
        ).innerHTML = `${result} seconds to finish for WASM`;

        document.getElementById("btn-wasm").classList.remove("disabled");
      }, 500);
    });
};

document
  .getElementById("btn-js")
  .addEventListener("click", function onJsClicked() {
    document.getElementById("btn-js").classList.add("disabled");

    document.getElementById("js-result").innerHTML = `Running JS test...`;

    setTimeout(function() {
      var result = jsBenchmark();

      document.getElementById(
        "js-result"
      ).innerHTML = `${result} seconds to finish for JS`;

      document.getElementById("btn-js").classList.remove("disabled");
    }, 500);
  });

function jsBenchmark() {
  const MAX_SIZE = 1000000;
  const MAX_RUNS = 1000;

  const arr = [];
  for (let i = 0; i < MAX_SIZE; i++) {
    arr[i] = 0;
  }

  const t = performance.now();
  for (let i = 0; i < MAX_RUNS; i++) {
    for (let j = 0; j < MAX_SIZE; j++) {
      arr[j] = Math.random();
    }
  }
  const seconds = (performance.now() - t) / 1000;

  return seconds;
}

const colors = [
  "#666666",
  "#002a88",
  "#1412a7",
  "#3b00a4",
  "#5c007e",
  "#6e0040",
  "#6c0600",
  "#561d00",
  "#333500",
  "#0b4800",
  "#005200",
  "#004f08",
  "#00404d",
  "#000000",
  "#000000",
  "#000000",
  "#adadad",
  "#155fd9",
  "#4240ff",
  "#7527fe",
  "#a01acc",
  "#b71e7b",
  "#b53120",
  "#994e00",
  "#6b6d00",
  "#388700",
  "#0c9300",
  "#008f32",
  "#007c8d",
  "#000000",
  "#000000",
  "#000000",
  "#fffeff",
  "#64b0ff",
  "#9290ff",
  "#c676ff",
  "#f36aff",
  "#fe6ecc",
  "#fe8170",
  "#ea9e22",
  "#bcbe00",
  "#88d800",
  "#5ce430",
  "#45e082",
  "#48cdde",
  "#4f4f4f",
  "#000000",
  "#000000",
  "#fffeff",
  "#c0dfff",
  "#d3d2ff",
  "#e8c8ff",
  "#fbc2ff",
  "#fec4ea",
  "#feccc5",
  "#f7d8a5",
  "#e4e594",
  "#cfef96",
  "#bdf4ab",
  "#b3f3cc",
  "#b5ebf2",
  "#b8b8b8",
  "#000000",
  "#000000"
];

const Tests = {
  Test01: {
    CanvasId: "test-1-main",
    ButtonId: "btn-test-1",
    ResultNofication: "test-1-result"
  },
  Test02: {
    CanvasId: "test-2-main",
    ButtonId: "btn-test-2",
    ResultNofication: "test-2-result"
  },
  Test03: {
    CanvasId: "test-3-main",
    ButtonId: "btn-test-3",
    ResultNofication: "test-3-result"
  },
  Test04: {
    CanvasId: "test-4-main",
    ButtonId: "btn-test-4",
    ResultNofication: "test-4-result"
  },
  Test05: {
    CanvasId: "test-5-main",
    ButtonId: "btn-test-5",
    ResultNofication: "test-5-result"
  },
  Test06: {
    CanvasId: "test-6-main",
    ButtonId: "btn-test-6",
    ResultNofication: "test-6-result"
  }
};
const STD_WIDTH = 256;
const STD_HEIGHT = 240;
const TOTAL_FRAMES = 120;

const frames = [];

let randomIndex = 0;
for (let f = 0; f < TOTAL_FRAMES; f++) {
  const frameBuffer = [];
  for (let i = 0; i < STD_HEIGHT; i++) {
    frameBuffer.push([]);
    for (let j = 0; j < STD_WIDTH; j++) {
      if ((i * j) % 8 === 0) {
        randomIndex = Math.ceil(Math.random() * 64);
      }
      if (f !== 0 && (i * j) % 3 === 0) {
        randomIndex = frames[f - 1][i][j];
      }
      frameBuffer[i].push(colors[randomIndex]);
    }
  }

  frames.push(frameBuffer);
}

const sampleFrame = frames[frames.length - 1];

const canvas = document.getElementById("main");
canvas.width = STD_WIDTH;
canvas.height = STD_HEIGHT;

const context = canvas.getContext("2d");

for (let i = 0; i < STD_HEIGHT; i++) {
  for (let j = 0; j < STD_WIDTH; j++) {
    context.strokeStyle = sampleFrame[i][j];

    context.beginPath();
    context.moveTo(j, i);
    context.lineTo(j + 1, i + 1);
    context.stroke();
    context.closePath();
  }
}

/** TEST 1 */
const btnTest1 = document.getElementById(Tests.Test01.ButtonId);
btnTest1.addEventListener("click", function() {
  document.getElementById(Tests.Test01.ResultNofication).innerHTML =
    "Running Test";

  function test() {
    const canvas = document.getElementById(Tests.Test01.CanvasId);
    canvas.width = STD_WIDTH;
    canvas.height = STD_HEIGHT;

    const context = canvas.getContext("2d");
    const start = performance.now();

    let f = 0;

    function drawFrame() {
      if (f === TOTAL_FRAMES) {
        const totalTime = performance.now() - start;
        document.getElementById(Tests.Test01.ResultNofication).innerHTML =
          "Result " + totalTime + " ms";
        return;
      }

      const currFrame = frames[f];

      for (let i = 0; i < STD_HEIGHT; i++) {
        for (let j = 0; j < STD_WIDTH; j++) {
          context.strokeStyle = currFrame[i][j];

          context.beginPath();
          context.moveTo(j, i);
          context.lineTo(j + 1, i + 1);
          context.stroke();
          context.closePath();
        }
      }

      f++;

      document.getElementById(Tests.Test01.ResultNofication).innerHTML =
        "Processed " + f + " / " + TOTAL_FRAMES;

      requestAnimationFrame(drawFrame);
    }

    requestAnimationFrame(drawFrame);
  }

  setTimeout(test, 500);
});

/** TEST 2 */
const btnTest2 = document.getElementById(Tests.Test02.ButtonId);
btnTest2.addEventListener("click", function() {
  const pixelCache = [];
  for (let i = 0; i < STD_HEIGHT; i++) {
    pixelCache.push([]);
    for (let j = 0; j < STD_WIDTH; j++) {
      pixelCache[i].push("");
    }
  }

  document.getElementById(Tests.Test02.ResultNofication).innerHTML =
    "Running Test";

  function test() {
    const canvas = document.getElementById(Tests.Test02.CanvasId);
    canvas.width = STD_WIDTH;
    canvas.height = STD_HEIGHT;

    const context = canvas.getContext("2d");
    const start = performance.now();

    let f = 0;

    function drawFrame() {
      if (f === TOTAL_FRAMES) {
        const totalTime = performance.now() - start;
        document.getElementById(Tests.Test02.ResultNofication).innerHTML =
          "Result " + totalTime + " ms";
        return;
      }

      const currFrame = frames[f];
      for (let i = 0; i < STD_HEIGHT; i++) {
        for (let j = 0; j < STD_WIDTH; j++) {
          if (pixelCache[i][j] === currFrame[i][j]) {
            continue;
          }

          pixelCache[i][j] = currFrame[i][j];
          context.strokeStyle = pixelCache[i][j];

          context.beginPath();
          context.moveTo(j, i);
          context.lineTo(j + 1, i + 1);
          context.stroke();
          context.closePath();
        }
      }

      f++;
      document.getElementById(Tests.Test02.ResultNofication).innerHTML =
        "Processed " + f + " / " + TOTAL_FRAMES;

      requestAnimationFrame(drawFrame);
    }

    requestAnimationFrame(drawFrame);
  }

  setTimeout(test, 500);
});

/** TEST 3 */
const btnTest3 = document.getElementById(Tests.Test03.ButtonId);
btnTest3.addEventListener("click", function() {
  const pixelCache = [];
  for (let i = 0; i < STD_HEIGHT; i++) {
    pixelCache.push([]);
    for (let j = 0; j < STD_WIDTH; j++) {
      pixelCache[i].push("");
    }
  }

  document.getElementById(Tests.Test03.ResultNofication).innerHTML =
    "Running Test";

  function test() {
    const backCanvas = document.createElement("canvas");
    backCanvas.width = STD_WIDTH;
    backCanvas.height = STD_HEIGHT;

    const backContext = backCanvas.getContext("2d");

    const canvas = document.getElementById(Tests.Test03.CanvasId);
    canvas.width = STD_WIDTH;
    canvas.height = STD_HEIGHT;

    const context = canvas.getContext("2d");
    const start = performance.now();

    let f = 0;

    function drawFrame() {
      if (f === TOTAL_FRAMES) {
        const totalTime = performance.now() - start;
        document.getElementById(Tests.Test03.ResultNofication).innerHTML =
          "Result " + totalTime + " ms";
        return;
      }

      const currFrame = frames[f];
      for (let i = 0; i < STD_HEIGHT; i++) {
        for (let j = 0; j < STD_WIDTH; j++) {
          if (pixelCache[i][j] === currFrame[i][j]) {
            continue;
          }

          pixelCache[i][j] = currFrame[i][j];
          backContext.strokeStyle = pixelCache[i][j];

          backContext.beginPath();
          backContext.moveTo(j, i);
          backContext.lineTo(j + 1, i + 1);
          backContext.stroke();
          backContext.closePath();
        }
      }

      f++;

      context.drawImage(backCanvas, 0, 0);

      document.getElementById(Tests.Test03.ResultNofication).innerHTML =
        "Processed " + f + " / " + TOTAL_FRAMES;

      requestAnimationFrame(drawFrame);
    }

    requestAnimationFrame(drawFrame);
  }

  setTimeout(test, 500);
});

/** TEST 4 */
const btnTest4 = document.getElementById(Tests.Test04.ButtonId);
btnTest4.addEventListener("click", function() {
  document.getElementById(Tests.Test04.ResultNofication).innerHTML =
    "Running Test";

  function test() {
    const canvas = document.getElementById(Tests.Test04.CanvasId);
    canvas.width = STD_WIDTH;
    canvas.height = STD_HEIGHT;

    const context = canvas.getContext("2d");
    const start = performance.now();

    let f = 0;

    function drawFrame() {
      if (f === TOTAL_FRAMES) {
        const totalTime = performance.now() - start;
        document.getElementById(Tests.Test04.ResultNofication).innerHTML =
          "Result " + totalTime + " ms";
        return;
      }

      const currFrame = frames[f];

      for (let i = 0; i < STD_HEIGHT; i++) {
        for (let j = 0; j < STD_WIDTH; j++) {
          context.fillStyle = currFrame[i][j];
          context.fillRect(j, i, 1, 1);
        }
      }

      f++;
      document.getElementById(Tests.Test04.ResultNofication).innerHTML =
        "Processed " + f + " / " + TOTAL_FRAMES;
      requestAnimationFrame(drawFrame);
    }

    requestAnimationFrame(drawFrame);
  }

  setTimeout(test, 500);
});

/** Test 5 */
const btnTest5 = document.getElementById(Tests.Test05.ButtonId);
btnTest5.addEventListener("click", function() {
  const pixelCache = [];
  for (let i = 0; i < STD_HEIGHT; i++) {
    pixelCache.push([]);
    for (let j = 0; j < STD_WIDTH; j++) {
      pixelCache[i].push("");
    }
  }

  document.getElementById(Tests.Test05.ResultNofication).innerHTML =
    "Running Test";

  function test() {
    const canvas = document.getElementById(Tests.Test05.CanvasId);
    canvas.width = STD_WIDTH;
    canvas.height = STD_HEIGHT;

    const context = canvas.getContext("2d");
    const start = performance.now();

    let f = 0;

    function drawFrame() {
      if (f === TOTAL_FRAMES) {
        const totalTime = performance.now() - start;
        document.getElementById(Tests.Test05.ResultNofication).innerHTML =
          "Result " + totalTime + " ms";
        return;
      }
      const currFrame = frames[f];
      for (let i = 0; i < STD_HEIGHT; i++) {
        for (let j = 0; j < STD_WIDTH; j++) {
          if (pixelCache[i][j] === currFrame[i][j]) {
            continue;
          }

          pixelCache[i][j] = currFrame[i][j];
          context.fillStyle = pixelCache[i][j];
          context.fillRect(j, i, 1, 1);
        }
      }

      f++;
      document.getElementById(Tests.Test05.ResultNofication).innerHTML =
        "Processed " + f + " / " + TOTAL_FRAMES;
      requestAnimationFrame(drawFrame);
    }
    requestAnimationFrame(drawFrame);
  }

  setTimeout(test, 500);
});

/** Test 6 */
const btnTest6 = document.getElementById(Tests.Test06.ButtonId);
btnTest6.addEventListener("click", function() {
  const pixelCache = [];
  for (let i = 0; i < STD_HEIGHT; i++) {
    pixelCache.push([]);
    for (let j = 0; j < STD_WIDTH; j++) {
      pixelCache[i].push("");
    }
  }

  document.getElementById(Tests.Test06.ResultNofication).innerHTML =
    "Running Test";

  function test() {
    const backCanvas = document.createElement("canvas");
    backCanvas.width = STD_WIDTH;
    backCanvas.height = STD_HEIGHT;

    const backContext = backCanvas.getContext("2d");

    const canvas = document.getElementById(Tests.Test06.CanvasId);
    canvas.width = STD_WIDTH;
    canvas.height = STD_HEIGHT;

    const context = canvas.getContext("2d");
    const start = performance.now();

    let f = 0;

    function drawFrame() {
      if (f === TOTAL_FRAMES) {
        const totalTime = performance.now() - start;
        document.getElementById(Tests.Test06.ResultNofication).innerHTML =
          "Result " + totalTime + " ms";
        return;
      }
      const currFrame = frames[f];
      for (let i = 0; i < STD_HEIGHT; i++) {
        for (let j = 0; j < STD_WIDTH; j++) {
          if (pixelCache[i][j] === currFrame[i][j]) {
            continue;
          }

          pixelCache[i][j] = currFrame[i][j];
          backContext.fillStyle = pixelCache[i][j];
          backContext.fillRect(j, i, 1, 1);
        }
      }

      context.drawImage(backCanvas, 0, 0);

      f++;
      document.getElementById(Tests.Test06.ResultNofication).innerHTML =
        "Processed " + f + " / " + TOTAL_FRAMES;
      requestAnimationFrame(drawFrame);
    }
    requestAnimationFrame(drawFrame);
  }

  setTimeout(test, 500);
});

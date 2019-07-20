var gamepad = null;
var buttons = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  L0: 4,
  R0: 5,
  L1: 6,
  L2: 7,
  SELECT: 8,
  START: 9,
  AX0: 10,
  AX1: 11,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
  XBOX: 16
};
var buttonLabel = [
  "A",
  "B",
  "X",
  "Y",
  "L0",
  "R0",
  "L1",
  "R1",
  "SELECT",
  "START",
  "AX0",
  "AX1",
  "UP",
  "DOWN",
  "LEFT",
  "RIGHT",
  "XBOX"
];

function detectButtonPress() {
  gamepad = navigator.getGamepads()[0];
  for (let i = 0; i < 17; i++) {
    if (gamepad.buttons[i].pressed) {
      document.getElementById("button-label").innerHTML = buttonLabel[i];
    }
  }

  requestAnimationFrame(detectButtonPress);
}

window.addEventListener("gamepadconnected", function(e) {
  document.getElementById("gamepad-info").innerHTML = `Gamepad connected: ${
    e.gamepad.id
  }`;
  gamepad = e.gamepad;

  detectButtonPress();
});

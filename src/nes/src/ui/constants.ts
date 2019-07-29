// Frame buffer constants
export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 240;
export const DEFAULT_FRAME_BUFFER_COLOR = "#0000C0";

// Input handling constants
export const PlayerOneKeyMap = {
  Start: "Enter",
  Select: "Shift",
  A: "k",
  B: "j",
  Up: "w",
  Down: "s",
  Left: "a",
  Right: "d"
};

export const PlayerTwoKeyMap = {
  Start: "/",
  Select: ".",
  A: "m",
  B: ",",
  Up: "ArrowUp",
  Down: "ArrowDown",
  Left: "ArrowLeft",
  Right: "ArrowRight"
};

export const PlayerJoyMap = {
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
}

export interface UiSoundState {
  bufferDataQueue: string[];
  currIndex: number;
}

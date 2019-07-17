// Frame buffer constants
export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 240;
export const DEFAULT_FRAME_BUFFER_COLOR = "#0000C0";

// Input handling constants
export const PlayerOneKeyMap = {
  Start: "Enter",
  Select: "Shift",
  A: "j",
  B: "k",
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

// Rom management related constants
export enum Roms {
  MarioBros,
  DonkeyKong,
  SpaceInvaders,
  F1Race,
  Tetris,
  SuperMarioBros,
  LegendOfZelda,
  MegaMan,
  FinalFantasy,
  SilkWorm,
  MegaMan2,
  TeenageMutantHeroTurtles
}
export const RomFiles = {
  MarioBros: require("../roms/mario.json"),
  DonkeyKong: require("../roms/donkey.json"),
  SpaceInvaders: require("../roms/space.json"),
  F1Race: require("../roms/f1race.json"),
  Tetris: require("../roms/tetris.json"),
  SuperMarioBros: require("../roms/smb.json"),
  LegendOfZelda: require("../roms/loz.json"),
  MegaMan: require("../roms/mm.json"),
  FinalFantasy: require("../roms/ff.json"),
  SilkWorm: require("../roms/silkworm.json"),
  MegaMan2: require("../roms/mm2.json"),
  TeenageMutantHeroTurtles: require("../roms/tmnt.json")
};

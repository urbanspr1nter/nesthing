import { Roms, RomFiles } from "./constants";

export default class RomManager {
  public static valueToGame(selected: number): Roms {
    switch (selected) {
      case 0:
        return Roms.MarioBros;
      case 1:
        return Roms.DonkeyKong;
      case 2:
        return Roms.SpaceInvaders;
      case 3:
        return Roms.F1Race;
      case 4:
        return Roms.Tetris;
      case 5:
        return Roms.SuperMarioBros;
      case 6:
        return Roms.LegendOfZelda;
      case 7:
        return Roms.MegaMan;
      case 8:
        return Roms.FinalFantasy;
      case 9:
        return Roms.SilkWorm;
    }
    return Roms.MarioBros;
  }

  public static getRomData(game: Roms) {
    switch (game) {
      case Roms.MarioBros:
        return RomFiles.MarioBros;
      case Roms.DonkeyKong:
        return RomFiles.DonkeyKong;
      case Roms.SpaceInvaders:
        return RomFiles.SpaceInvaders;
      case Roms.F1Race:
        return RomFiles.F1Race;
      case Roms.Tetris:
        return RomFiles.Tetris;
      case Roms.SuperMarioBros:
        return RomFiles.SuperMarioBros;
      case Roms.LegendOfZelda:
        return RomFiles.LegendOfZelda;
      case Roms.MegaMan:
        return RomFiles.MegaMan;
      case Roms.FinalFantasy:
        return RomFiles.FinalFantasy;
      case Roms.SilkWorm:
        return RomFiles.SilkWorm;
    }
  }
}
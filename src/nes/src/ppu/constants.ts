/**
 * The data structure to encapsulate the various sprite information
 * we will need to render.
 */
export interface SpriteData {
  Data: number;
  PositionX: number;
  Priority: number;
  BaseOamAddress: number;
}

export interface PpuState {
  ppuMemoryBits: number[];
  nameTableData: number[];
  register: number;
  ppuDataReadBuffer: number;
  cycles: number;
  scanlines: number;
  frames: number;
  evenFrame: boolean;
  spriteCount: number;
  ntByte: number;
  attributeByte: number;
  tileLowByte: number;
  tileHighByte: number;
  v: number;
  t: number;
  w: boolean;
  regPPUCTRL_nt0: number;
  regPPUCTRL_nt1: number;
  regPPUCTRL_vramIncrement: number;
  regPPUCTRL_spritePatternTableBaseAddress: number;
  regPPUCTRL_backgroundPatternTableBaseAddress: number;
  regPPUCTRL_spriteSizeLarge: boolean;
  regPPUCTRL_masterSlaveSelect: boolean;
  regPPUCTRL_generateNmiAtVblankStart: boolean;
  regPPUMASK_greyscale: boolean;
  regPPUMASK_showBgLeftMost8pxOfScreen: boolean;
  regPPUMASK_showSpritesLeftMost8pxOfScreen: boolean;
  regPPUMASK_showBackground: boolean;
  regPPUMASK_showSprites: boolean;
  regPPUMASK_emphasizeRed: boolean;
  regPPUMASK_emphasizeGreen: boolean;
  regPPUMASK_emphasizeBlue: boolean;
  regPPUSTATUS_spriteOverflow: boolean;
  regPPUSTATUS_spriteHit: boolean;
  nmiOccurred: boolean;
  regOAMADDR_address: number;
  regOAMDATA_data: number;
  regPPUSCROLL_x: number;
  regPPUSCROLL_y: number;
  bgTileHigh32: number;
  bgTileLow32: number;
  oam: number[];
  onScreenSprites: SpriteData[];
  nmiPrevious: boolean;
  nmiDelay: number;
}

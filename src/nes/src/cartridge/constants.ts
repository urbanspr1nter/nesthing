export interface CartridgeState {
  prg: number[];
  chr: number[];
  sram: number[];
  mapper: number;
  mirror: number;
  battery: number;
}

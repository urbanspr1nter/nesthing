/**
 * constants.ts
 * 
 * Roger Ngo
 */

/**
 * The cartridge has a state which allows for it to be saved and loaded into
 * memory.
 */
export interface CartridgeState {
  chr: number[],
  sram: number[];
  mapper: number;
  mirror: number;
  battery: number;
}

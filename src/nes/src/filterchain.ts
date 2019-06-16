import { Apu } from "./apu";

interface FirstOrderFilter {
  B0: number;
  B1: number;
  A1: number;
  PrevX?: number;
  PrevY?: number;
}

export class FilterChain {
  private _apu: Apu;
  private _filter: FirstOrderFilter;
  private _filters: FirstOrderFilter[];

  constructor(apu: Apu) {
    this._apu = apu;

    this._filter = {
      B0: 0,
      B1: 0,
      A1: 0,
      PrevX: 0,
      PrevY: 0
    };
  }

  public stepFilterChain(f: FirstOrderFilter, x: number) {
    const y = f.B0 * x + f.B1 * f.PrevX + f.A1 * f.PrevY;
    f.PrevY = y;
    f.PrevX = x;

    return y;
  }

  public lowPassFilter(
    sampleRate: number,
    cutoffFrequency: number
  ): FirstOrderFilter {
    const c = sampleRate / Math.PI / cutoffFrequency;
    const a0i = 1 / (1 + c);

    return {
      B0: a0i,
      B1: a0i,
      A1: (1 - c) * a0i
    };
  }

  public highPassFilter(
    sampleRate: number,
    cutoffFrequency: number
  ): FirstOrderFilter {
    const c = sampleRate / Math.PI / cutoffFrequency;
    const a0i = 1 / (1 + c);

    return {
      B0: c * a0i,
      B1: -c * a0i,
      A1: (1 - c) * a0i
    };
  }

  public step(x: number) {
      let workingX = x;
      if(this._filters) {
        for(let fc of this._filters) {
            workingX = this.stepFilterChain(fc, x);
        }
      }

      return workingX;
  }

}

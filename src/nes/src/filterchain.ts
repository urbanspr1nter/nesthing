interface FirstOrderFilter {
  B0: number;
  B1: number;
  A1: number;
  PrevX: number;
  PrevY: number;
}

export class FilterChain {
  private _filters: FirstOrderFilter[] | undefined;

  constructor() {
    this._filters = [];
  }

  public addFilters(f: FirstOrderFilter) {
    this._filters.push(f);
  }

  public clearFilters() {
    this._filters = undefined;
  }

  public stepFilterChain(f: FirstOrderFilter, x: number) {
    const y = f.B0 * x + f.B1 * f.PrevX - f.A1 * f.PrevY;
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

    const filter = {
      B0: a0i,
      B1: a0i,
      A1: (1 - c) * a0i,
      PrevX: 0,
      PrevY: 0
    };

    return filter;
  }

  public highPassFilter(
    sampleRate: number,
    cutoffFrequency: number
  ): FirstOrderFilter {
    const c = sampleRate / Math.PI / cutoffFrequency;
    const a0i = 1 / (1 + c);

    const filter = {
      B0: c * a0i,
      B1: -c * a0i,
      A1: (1 - c) * a0i,
      PrevX: 0,
      PrevY: 0
    };

    return filter;
  }

  public step(x: number) {
    let workingX = x;
    for (let f of this._filters) {
      workingX = this.stepFilterChain(f, workingX);
    }
    return workingX;
  }
}

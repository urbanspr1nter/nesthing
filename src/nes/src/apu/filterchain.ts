const PI = Math.PI;

interface FirstOrderFilter {
  B0: number;
  B1: number;
  A1: number;
  PrevX: number;
  PrevY: number;
}

export class Filter {
  private _filter: FirstOrderFilter;

  constructor(filter: FirstOrderFilter) {
    this._filter = filter;
  }

  public step(x: number): number {
    const y = (this._filter.B0 * x) 
      + (this._filter.B1 * this._filter.PrevX) 
      - (this._filter.A1 * this._filter.PrevY);

    this._filter.PrevY = y;
    this._filter.PrevX = x;

    return y;
  }
}

export class FilterChain {
  private _filters: Filter[];

  constructor() {
    this._filters = [];
  }

  public addFilters(f: Filter) {
    this._filters.push(f);
  }

  public lowPassFilter(
    sampleRate: number,
    cutoffFrequency: number
  ): Filter {
    const c = sampleRate / PI / cutoffFrequency;
    const a0i = 1 / (1 + c);

    const fof = {
      B0: a0i,
      B1: a0i,
      A1: (1 - c) * a0i,
      PrevX: 0,
      PrevY: 0
    };

    return new Filter(fof);
  }

  public highPassFilter(
    sampleRate: number,
    cutoffFrequency: number
  ): Filter {
    const c = sampleRate / PI / cutoffFrequency;
    const a0i = 1 / (1 + c);

    const fof = {
      B0: c * a0i,
      B1: -c * a0i,
      A1: (1 - c) * a0i,
      PrevX: 0,
      PrevY: 0
    };

    return new Filter(fof);
  }

  public step(x: number) {
    let workingX = x;
    for (let f of this._filters) {
      workingX = f.step(workingX);
    }
    return Math.fround(workingX);
  }
}

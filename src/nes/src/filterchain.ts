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
    const y = Math.fround(this._filter.B0 * x) 
      + Math.fround(this._filter.B1 * this._filter.PrevX) 
      - Math.fround(this._filter.A1 * this._filter.PrevY);

    this._filter.PrevY = Math.fround(y);
    this._filter.PrevX = Math.fround(x);

    return Math.fround(y);
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
    const c = Math.fround(sampleRate / Math.PI / Math.fround(cutoffFrequency));
    const a0i = Math.fround(1 / (1 + c));

    const fof = {
      B0: a0i,
      B1: a0i,
      A1: Math.fround((1 - c) * a0i),
      PrevX: 0,
      PrevY: 0
    };

    return new Filter(fof);
  }

  public highPassFilter(
    sampleRate: number,
    cutoffFrequency: number
  ): Filter {
    const c = Math.fround(sampleRate / Math.PI / Math.fround(cutoffFrequency));
    const a0i = Math.fround(1 / (1 + c));

    const fof = {
      B0: Math.fround(c * a0i),
      B1: Math.fround(-c * a0i),
      A1: Math.fround((1 - c) * a0i),
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

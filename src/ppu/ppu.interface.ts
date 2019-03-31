export enum IPpuMemoryOperation {
    Read = 0,
    Write = 1
};

export enum IPpuMemoryType {
    Ppu = 0,
    Oam = 1,
    Palette = 2
};

export interface IPpuActionItem {
    operation: IPpuMemoryOperation;
    address: number;
    data: number;
    type: IPpuMemoryType;
};

export interface ILatch {
    value: number|undefined;
};

// Used as a a latch to perform the Writes and Reads (x2) from the CPU
export const PpuGenLatch: ILatch = {
    value: undefined
}

import { Memory } from "../memory/memory";
import { DoubleByteRegister } from "./double-byte-register";
import { ByteRegister } from "./byte-register";

export class CpuAddressingHelper {
    private _memory: Memory;

    constructor(memory: Memory) {
        this._memory = memory;
    }

    /**
     * Gets the immediate value. Effectively a pass-through.
     * 
     * @param regPC Effective value at the PC address, 8 bits wide.
     * @returns effectiveAddress The 8 bits wide value stored in the PC location.
     */
    public atImmediate(regPC: DoubleByteRegister): number {
        return regPC.get();
    }

    /**
     * Gets the absolute effective address.
     * 
     * @param regPC The current PC
     * @returns effectiveAddress The 16 bits wide effective address.
     */
    public atAbsolute(regPC: DoubleByteRegister): number {
        const lowByte = this._memory.get(regPC.get());
        const highByte = this._memory.get(regPC.get() + 1);
        const effectiveAddress = (highByte << 8) | lowByte;

        return effectiveAddress;
    }

    public atAbsoluteIndirect(regPC: DoubleByteRegister): number {
        const absoluteAddress = this.atAbsolute(regPC);
        if((absoluteAddress & 0x00FF) === 0xFF) {
            let effectiveLow = this._memory.get(absoluteAddress);
            let effectiveHigh = this._memory.get(absoluteAddress & 0xFF00);
            
            return (effectiveHigh << 8) | effectiveLow;
        } else {
            let effectiveLow = this._memory.get(absoluteAddress);
            let effectiveHigh = this._memory.get(absoluteAddress + 1);

            return (effectiveHigh << 8) | effectiveLow;
        }
    }

    /**
     * Gets the direct page effective address.
     * 
     * @param regPC The current PC
     * @returns effectiveAddress The 8 bits wide effective address.
     */
    public atDirectPage(regPC: DoubleByteRegister): number {
        const lowByte = this._memory.get(regPC.get());
        const effectiveAddress = lowByte;

        return effectiveAddress;
    }

    /**
     * Gets the absolute indexed, x effective address.
     * 
     * 1) Get the 2 bytes pointed by the PC in memory. This is base address.
     * 2) Add the base address and X value together to form the effective address.
     * 
     * @param regPC The current PC 
     * @param x The current X
     * @returns effectiveAddress, the 16 bits wide effective address
     */
    public atAbsoluteIndexedX(regPC: DoubleByteRegister, x: ByteRegister) {
        const baseAddress = this.atAbsolute(regPC);
        const effectiveAddress = baseAddress + x.get();

        return effectiveAddress;
    }

    /**
     * Gets the absolute indexed, y effective address.
     * 
     * @param regPC The current PC 
     * @param y The current Y
     * @returns effectiveAddress, the 16 bits wide effective address
     */
    public atAbsoluteIndexedY(regPC: DoubleByteRegister, y: ByteRegister) {
        const baseAddress = this.atAbsolute(regPC);
        const effectiveAddress = baseAddress + y.get();

        return effectiveAddress;
    }

    /**
     * Gets the direct page indexed, x effective address.
     * 
     * The effective address is a wrap-around of the sum 
     * of the direct page base address, and x-value.
     * 
     * @param regPC The current PC
     * @param x The current X
     * @returns effectiveAddress the 8 bits wide effective address
     */
    public atDirectPageIndexedX(regPC: DoubleByteRegister, x: ByteRegister) {
        const baseAddress = this.atDirectPage(regPC);
        const effectiveAddress = (baseAddress + x.get()) & 0xFF
        
        return effectiveAddress;
    }

    /**
     * Gets the direct page indexed, y effective address.
     * 
     * The effective address is a wrap-around of the sum 
     * of the direct page base address, and x-value.
     * 
     * @param regPC The current PC
     * @param x The current X
     * @returns effectiveAddress the 8 bits wide effective address
     */
    public atDirectPageIndexedY(regPC: DoubleByteRegister, y: ByteRegister) {
        const baseAddress = this.atDirectPage(regPC);
        const effectiveAddress = (baseAddress + y.get()) & 0xFF
        
        return effectiveAddress;
    }

    /**
     * 1) Get the byte pointed by PC in memory. This is the base low byte
     * 2) Take the base low byte and add X --> this is the base low byte (wrap)
     * 3) Take the base low byte and add X and add 1 --> this is the base high byte (wrap)
     * 4) Get the address by combining 2, 3. 
     * 5) Effective address is the 2 bytes in memory pointed by (4).
     * 
     * @param regPC The current PC
     * @param x The current X
     */
    public atDirectPageIndexedIndirectX(regPC: DoubleByteRegister, x: ByteRegister) {
        const baseLowByte = this.atDirectPage(regPC);
        const indirectLow = (baseLowByte + x.get()) & 0xFF;
        const indirectHigh = (indirectLow + 1) & 0xFF;
        const baseAddress = (indirectHigh << 8) | (indirectLow);

        const effectiveLow = this._memory.get(indirectLow);
        const effectiveHigh = this._memory.get(indirectHigh);

        const effectiveAddress = (effectiveHigh << 8) | effectiveLow;

        return effectiveAddress;
    }

    /**
     * Gets the Direct Page, Indirect Indexed Y Address.
     * 
     * @param regPC The current PC
     * @param y The current Y
     */
    public atDirectPageIndirectIndexedY(regPC: DoubleByteRegister, y: ByteRegister) {
        const baseLowByte = this.atDirectPage(regPC);
        const indirectLow = this._memory.get(baseLowByte);
        const indirectHigh = this._memory.get((baseLowByte + 1) & 0xFF);

        const effectiveLow = (indirectLow + y.get()) & 0xFF;
        const carry = (indirectLow + y.get()) > 255 ? 1 : 0;
        const effectiveHigh = (indirectHigh) + (carry);

        const effectiveAddress = effectiveHigh << 8 | effectiveLow;

        return effectiveAddress;
    }

    public crossesPageBoundaryAtAbsoluteIndexedX(regPC: DoubleByteRegister, x: ByteRegister): boolean {
        const baseAddress = this.atAbsolute(regPC);

        const effectiveAddress = baseAddress + x.get();

        if((effectiveAddress & 0xFF00) !== (baseAddress & 0xFF00)) {
            return true;
        } else {
            return false;
        }
    }

    public crossesPageBoundaryAtAbsoluteIndexedY(regPC: DoubleByteRegister, y: ByteRegister): boolean {
        const baseAddress = this.atAbsolute(regPC);

        const effectiveAddress = baseAddress + y.get();

        if((effectiveAddress & 0xFF00) !== (baseAddress & 0xFF00)) {
            return true;
        } else {
            return false;
        }
    }


    /**
     * Utility Methd to check if a page boundary has been crossed
     * @param regPC 
     * @param y 
     */
    public crossesPageBoundaryAtDirectPageIndirectIndexedY(regPC: DoubleByteRegister, y: ByteRegister) {
        const baseLowByte = this.atDirectPage(regPC);
        const indirectLow = this._memory.get(baseLowByte);

        return (indirectLow + y.get()) > 255 ? 1 : 0;
    }
}

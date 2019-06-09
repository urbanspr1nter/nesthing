import { ByteRegister, DoubleByteRegister } from "./register.interface";
import { Memory } from "./memory";
import {
  IrqVectorLocation,
  NmiVectorLocation,
  ResetVectorLocation,
  StatusBitPositions,
  InterruptRequestType,
  Cycles,
  AddressingModes,
  InstructionSizes,
  OpAddressingMode,
  PageCycles
} from "./cpu.interface";

export interface CycleContext {
  PC: number;
  Address: number;
  Mode: AddressingModes;
}

export class Cpu {
  private _memory: Memory;

  private _currentCycles: number;

  // Cycles to stall
  private _stallCycles: number;

  // Registers
  private _regA: ByteRegister;
  private _regX: ByteRegister;
  private _regY: ByteRegister;
  private _regPC: DoubleByteRegister;
  private _regSP: ByteRegister;
  private _regP: ByteRegister;

  // Helpers
  private _interrupt: InterruptRequestType;

  private _context: CycleContext;

  constructor(memory: Memory) {
    this._currentCycles = 0;

    this._memory = memory;

    this._regA = new ByteRegister(0x00);
    this._regX = new ByteRegister(0x00);
    this._regY = new ByteRegister(0x00);
    this._regPC = new DoubleByteRegister(0x00);
    this._regSP = new ByteRegister(0x00);
    this._regP = new ByteRegister(0x00);

    this._interrupt = InterruptRequestType.None;

    this._stallCycles = 0;

    this._context = {
      PC: this._regPC.get(),
      Address: 0,
      Mode: AddressingModes.Immediate
    };
  }

  public setStallCycles(cycles: number) {
    this._stallCycles = cycles;
  }

  public stallCycles(): number {
    return this._stallCycles;
  }

  public totalCycles(): number {
    return this._currentCycles;
  }

  private _memWrite(address: number, data: number) {
    this._memory.set(address, data);
  }

  private _memRead(address: number): number {
    return this._memory.get(address);
  }

  private _read16(address: number): number {
    const low = this._memRead(address);
    const high = this._memRead(address + 1);

    return ((high << 8) | low) & 0xffff;
  }

  private _read16Bug(address: number): number {
    const a = address;
    const b = (a & 0xff00) | (((a & 0xff) + 1) & 0xff);
    const low = this._memRead(a);
    const high = this._memRead(b);

    const effAddress = ((high << 8) | low) & 0xffff;

    return effAddress;
  }

  public powerUp(): void {
    this._regP.set(0x34);

    this._regA.set(0);
    this._regX.set(0);
    this._regY.set(0);
    this._regSP.set(0x01fd);

    // Frame IRQ Enabled
    this._memWrite(0x4015, 0);

    // All channels disabled
    this._memWrite(0x4017, 0);

    for (let i = 0x4000; i <= 0x400f; i++) {
      this._memWrite(i, 0x0);
    }

    for (let i = 0x0000; i <= 0x07ff; i++) {
      this._memWrite(i, 0xff);
    }

    // Perform the RESET Interrupt
    this.interruptReset();

    //this._regPC.set(0xc000);
    this._context = {
      PC: 0,
      Address: 0,
      Mode: AddressingModes.Immediate
    };
  }

  public interruptReset(): void {
    const currPcLow = this._regPC.get() & 0xff;
    const currPcHigh = (this._regPC.get() >>> 8) & 0xff;

    this.stackPush(currPcHigh);
    this.stackPush(currPcLow);

    this.stackPush(this._regP.get());

    this.setStatusBit(StatusBitPositions.InterruptDisable);

    this._regPC.set(
      (this._memRead(ResetVectorLocation.High) << 8) |
        this._memRead(ResetVectorLocation.Low)
    );

    this.setStatusBit(StatusBitPositions.InterruptDisable);

    this._currentCycles += 7;
  }

  public stackPush(data: number): void {
    const address = 0x100 | this._regSP.get();
    this._memWrite(address, data);
    this._regSP.set(address - 1);
  }

  public stackPull(): number {
    const address = 0x100 | (this._regSP.get() + 1);
    this._regSP.set(address);
    return this._memRead(address);
  }

  public getA(): number {
    return this._regA.get();
  }
  public getX(): number {
    return this._regX.get();
  }
  public getY(): number {
    return this._regY.get();
  }
  public getPC(): number {
    return this._regPC.get();
  }
  public getSP(): number {
    return this._regSP.get();
  }
  public getP(): number {
    return this._regP.get();
  }
  public getCurrentCycles(): number {
    return this._currentCycles;
  }

  public setStatusBit(bit: StatusBitPositions): void {
    this._regP.set(this._regP.get() | (0x01 << bit));
  }

  public clearStatusBit(bit: StatusBitPositions): void {
    this._regP.set(this._regP.get() & ~(0x01 << bit));
  }

  public getStatusBitFlag(bit: StatusBitPositions): boolean {
    return (this._regP.get() & (0x01 << bit)) > 0;
  }

  public isOverflow(first: number, second: number, final: number): boolean {
    const modifiedFirst = first & 0xff;
    const modifiedSecond = second & 0xff;
    const modifiedFinal = final & 0xff;
    if (
      ((modifiedFirst ^ modifiedSecond) & 0x80) !== 0 &&
      ((modifiedFirst ^ modifiedFinal) & 0x80) !== 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  public isCarry(first: number, second: number, carry: number, adc: boolean) {
    const modifiedFirst = first & 0xff;
    const modifiedSecond = second & 0xff;
    const modifiedCarry = carry & 0xff;
    if (adc) {
      return modifiedFirst + modifiedSecond + modifiedCarry > 0xff;
    } else {
      return (modifiedFirst & 0xff) - (modifiedSecond & 0xff) - modifiedCarry >= 0;
    }
  }

  private _crossesPageBoundary(a: number, b: number): boolean {
    return (a & 0xff00) !== (b & 0xff00);
  }

  private _addBranchCycles(context: CycleContext) {
    this._currentCycles++;
    if (this._crossesPageBoundary(context.PC, context.Address)) {
      this._currentCycles++;
    }
  }

  private _setNegative(dataByte: number) {
    const modified = dataByte & 0xff;
    if ((modified & 0x80) === 0x80) {
      this.setStatusBit(StatusBitPositions.Negative);
    } else {
      this.clearStatusBit(StatusBitPositions.Negative);
    }
  }

  private _setZero(dataByte: number) {
    const modified = dataByte & 0xff;
    if (modified === 0) {
      this.setStatusBit(StatusBitPositions.Zero);
    } else {
      this.clearStatusBit(StatusBitPositions.Zero);
    }
  }

  public setupNmi() {
    const currPcLow = this._regPC.get() & 0xff;
    const currPcHigh = (this._regPC.get() >>> 8) & 0xff;

    this.stackPush(currPcHigh);
    this.stackPush(currPcLow);

    this.stackPush(this._regP.get());

    this.setStatusBit(StatusBitPositions.InterruptDisable);

    this._regPC.set(
      (this._memRead(NmiVectorLocation.High) << 8) |
        this._memRead(NmiVectorLocation.Low)
    );

    this._currentCycles += 7;

    this._interrupt = InterruptRequestType.NMI;
  }

  public adc() {
    const a = this._regA.get();
    const b = this._memRead(this._context.Address);
    const carry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;

    this._regA.set(a + b + carry);

    this._setZero(this._regA.get());
    this._setNegative(this._regA.get());

    if (this.isCarry(a, b, carry, true)) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }

    if (this.isOverflow(a, b, this._regA.get())) {
      this.setStatusBit(StatusBitPositions.Overflow);
    } else {
      this.clearStatusBit(StatusBitPositions.Overflow);
    }
  }

  public and() {
    this._regA.set(this._regA.get() & this._memRead(this._context.Address));

    this._setZero(this._regA.get());
    this._setNegative(this._regA.get());
  }

  public asl() {
    let carry;
    let result;
    if (this._context.Mode === AddressingModes.Accumulator) {
      carry = (this._regA.get() >>> 7) & 1;
      this._regA.set(this._regA.get() << 1);
      result = this._regA.get();
    } else {
      const operand = this._memRead(this._context.Address);
      carry = (operand >>> 7) & 1;
      result = operand << 1;

      this._memWrite(this._context.Address, result);
    }

    if (carry === 1) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }

    this._setNegative(result);
    this._setZero(result);
  }

  public bcc() {
    if (!this.getStatusBitFlag(StatusBitPositions.Carry)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  public bcs() {
    if (this.getStatusBitFlag(StatusBitPositions.Carry)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  public beq() {
    if (this.getStatusBitFlag(StatusBitPositions.Zero)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  public bit() {
    const value = this._memRead(this._context.Address);
    const overflow = (value >>> 6) & 1;

    if (overflow > 0) {
      this.setStatusBit(StatusBitPositions.Overflow);
    } else {
      this.clearStatusBit(StatusBitPositions.Overflow);
    }

    const result = value & this._regA.get() & 0xff;
    this._setZero(result);

    this._setNegative(value);
  }

  public bmi() {
    if (this.getStatusBitFlag(StatusBitPositions.Negative)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  public bne() {
    if (!this.getStatusBitFlag(StatusBitPositions.Zero)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  public bpl() {
    if (!this.getStatusBitFlag(StatusBitPositions.Negative)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  public brk() {
    this.stackPush((this._regPC.get() & 0xff00) >>> 8);
    this.stackPush(this._regPC.get() & 0x00ff);

    this.php();
    this.sei();

    let interruptVectorLow = this._memRead(IrqVectorLocation.Low);
    let interruptVectorHigh = this._memRead(IrqVectorLocation.High);

    this._regPC.set((interruptVectorHigh << 8) | interruptVectorLow);

    this._interrupt = InterruptRequestType.IRQ;
  }

  public bvc() {
    if (!this.getStatusBitFlag(StatusBitPositions.Overflow)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  public bvs() {
    if (this.getStatusBitFlag(StatusBitPositions.Overflow)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  public clc() {
    this.clearStatusBit(StatusBitPositions.Carry);
  }

  public cld() {
    this.clearStatusBit(StatusBitPositions.DecimalMode);
  }

  public cli() {
    this.clearStatusBit(StatusBitPositions.InterruptDisable);
  }

  public clv() {
    this.clearStatusBit(StatusBitPositions.Overflow);
  }

  private _compare(a: number, b: number) {
    const xformedA = a & 0xff;
    const xformedB = b & 0xff;
    const result = (xformedA - xformedB) & 0xff;

    this._setZero(result);
    this._setNegative(result);

    if (xformedA >= xformedB) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }
  }

  public cmp() {
    const value = this._memRead(this._context.Address);
    this._compare(this._regA.get(), value);
  }

  public cpx() {
    const value = this._memRead(this._context.Address);
    this._compare(this._regX.get(), value);
  }

  public cpy() {
    const value = this._memRead(this._context.Address);
    this._compare(this._regY.get(), value);
  }

  public dcp() {}

  public dec() {
    const value = this._memRead(this._context.Address) - 1;
    this._memWrite(this._context.Address, value);
    this._setZero(value);
    this._setNegative(value);
  }

  public dex() {
    this._regX.set(this._regX.get() - 1);

    this._setZero(this._regX.get());
    this._setNegative(this._regX.get());
  }

  public dey() {
    this._regY.set(this._regY.get() - 1);
    this._setZero(this._regY.get());
    this._setNegative(this._regY.get());
  }

  public eor() {
    const result = this._regA.get() ^ this._memRead(this._context.Address);
    this._regA.set(result);

    this._setNegative(result);
    this._setZero(result);
  }

  public inc() {
    const value = this._memRead(this._context.Address) + 1;
    this._memWrite(this._context.Address, value);

    this._setZero(value);
    this._setNegative(value);
  }

  public inx() {
    this._regX.set(this._regX.get() + 1);
    this._setZero(this._regX.get());
    this._setNegative(this._regX.get());
  }

  public iny() {
    this._regY.set(this._regY.get() + 1);
    this._setZero(this._regY.get());
    this._setNegative(this._regY.get());
  }

  public isb() {}

  public jmp() {
    this._regPC.set(this._context.Address);
  }

  public jsr() {
    const startAddr = this._regPC.get() - 1;
    this.stackPush((startAddr & 0xff00) >>> 8);
    this.stackPush(startAddr & 0x00ff);

    this._regPC.set(this._context.Address);
  }

  public lax() {}

  public lda() {
    this._regA.set(this._memRead(this._context.Address));
    this._setNegative(this._regA.get());
    this._setZero(this._regA.get());
  }

  public ldx() {
    this._regX.set(this._memRead(this._context.Address));
    this._setNegative(this._regX.get());
    this._setZero(this._regX.get());
  }

  public ldy() {
    this._regY.set(this._memRead(this._context.Address));
    this._setNegative(this._regY.get());
    this._setZero(this._regY.get());
  }

  public lsr() {
    let carry;
    let result;

    if (this._context.Mode === AddressingModes.Accumulator) {
      carry = this._regA.get() & 1;
      this._regA.set(this._regA.get() >>> 1);
      result = this._regA.get();
    } else {
      const value = this._memRead(this._context.Address);
      carry = value & 1;

      result = value >>> 1;
      this._memWrite(this._context.Address, result);
    }

    this._setNegative(result);
    this._setZero(result);

    if (carry === 1) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }
  }

  public nop() {
    // noop
  }

  public skb() {}

  public ign() {}

  public ora() {
    this._regA.set(this._regA.get() | this._memRead(this._context.Address));
    this._setNegative(this._regA.get());
    this._setZero(this._regA.get());
  }

  public pha() {
    this.stackPush(this._regA.get());
  }

  public php() {
    let pStatus = this._regP.get() | 0x10;
    this.stackPush(pStatus);
  }

  public pla() {
    this._regA.set(this.stackPull());
    this._setNegative(this._regA.get());
    this._setZero(this._regA.get());
  }

  public plp() {
    let pStatus = (this.stackPull() & 0xef) | 0x20;
    this._regP.set(pStatus);
  }

  public rla() {}

  public rol() {
    const currCarry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;
    let newCarry;
    let result;

    if (this._context.Mode === AddressingModes.Accumulator) {
      newCarry = (this._regA.get() >>> 7) & 1;
      this._regA.set((this._regA.get() << 1) | currCarry);

      result = this._regA.get();
    } else {
      const value = this._memRead(this._context.Address);
      newCarry = (value >>> 7) & 1;

      result = (value << 1) | currCarry;

      this._memWrite(this._context.Address, result);
    }

    this._setNegative(result);
    this._setZero(result);

    if (newCarry === 1) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }
  }

  public ror() {
    const currCarry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;
    let newCarry;
    let result;

    if (this._context.Mode === AddressingModes.Accumulator) {
      newCarry = this._regA.get() & 1;
      this._regA.set((this._regA.get() >>> 1) | (currCarry << 7));

      result = this._regA.get();
    } else {
      const value = this._memRead(this._context.Address);
      newCarry = value & 1;

      result = (value >>> 1) | (currCarry << 7);

      this._memWrite(this._context.Address, result);
    }

    this._setNegative(result);
    this._setZero(result);

    if (newCarry === 1) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }
  }

  public rra() {}

  public rti() {
    const newP = (this.stackPull() & 0xef) | 0x20;
    const pcLow = this.stackPull();
    const pcHigh = this.stackPull();

    this._regPC.set((pcHigh << 8) | pcLow);
    this._regP.set(newP);
  }

  public rts() {
    const newLowPC = this.stackPull();
    const newHighPC = this.stackPull();

    this._regPC.set(((newHighPC << 8) | newLowPC) + 1);
  }

  public sax() {}

  public sbc() {
    const a = this._regA.get();
    const b = this._memRead(this._context.Address);
    const carry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;

    this._regA.set(a - b - (1 - carry));

    this._setZero(this._regA.get());
    this._setNegative(this._regA.get());

    if (this.isCarry(a, b, 1 - carry, false)) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }

    if (this.isOverflow(a, b, this._regA.get())) {
      this.setStatusBit(StatusBitPositions.Overflow);
    } else {
      this.clearStatusBit(StatusBitPositions.Overflow);
    }
  }

  public sec() {
    this.setStatusBit(StatusBitPositions.Carry);
  }

  public sed() {
    this.setStatusBit(StatusBitPositions.DecimalMode);
  }

  public sei() {
    this.setStatusBit(StatusBitPositions.InterruptDisable);
  }

  public slo() {}

  public sre() {}

  public sta() {
    this._memWrite(this._context.Address, this._regA.get());
  }

  public stx() {
    this._memWrite(this._context.Address, this._regX.get());
  }

  public sty() {
    this._memWrite(this._context.Address, this._regY.get());
  }

  public tax() {
    this._regX.set(this._regA.get());
    this._setNegative(this._regX.get());
    this._setZero(this._regX.get());
  }

  public tay() {
    this._regY.set(this._regA.get());
    this._setNegative(this._regY.get());
    this._setZero(this._regY.get());
  }

  public tsx() {
    this._regX.set(this._regSP.get());

    this._setNegative(this._regX.get());
    this._setZero(this._regX.get());
  }

  public txa() {
    this._regA.set(this._regX.get());

    this._setNegative(this._regA.get());
    this._setZero(this._regA.get());
  }

  public txs() {
    this._regSP.set(this._regX.get());
  }

  public tya() {
    this._regA.set(this._regY.get());
    this._setNegative(this._regA.get());
    this._setZero(this._regA.get());
  }

  public runStallCycle() {
    this._stallCycles--;
    this._currentCycles++;
  }

  private _getAddressFromMode(mode: AddressingModes) {
    let address = 0;
    let pageCrossed = false;

    switch (mode) {
      case AddressingModes.Immediate:
        address = this._regPC.get() + 1;
        break;
      case AddressingModes.Absolute:
        address = this._read16(this._regPC.get() + 1);
        break;
      case AddressingModes.AbsoluteIndirect:
        address = this._read16Bug(this._read16(this._regPC.get() + 1));
        break;
      case AddressingModes.DirectPage:
        address = this._memRead(this._regPC.get() + 1);
        break;
      case AddressingModes.AbsoluteIndexedX:
        address = this._read16(this._regPC.get() + 1) + this._regX.get();
        pageCrossed = this._crossesPageBoundary(
          address - this._regX.get(),
          address
        );
        break;
      case AddressingModes.AbsoluteIndexedY:
        address = this._read16(this._regPC.get() + 1) + this._regY.get();
        pageCrossed = this._crossesPageBoundary(
          address - this._regY.get(),
          address
        );
        break;
      case AddressingModes.DirectPageIndexedX:
        address =
          (this._memRead(this._regPC.get() + 1) + this._regX.get()) & 0xff;
        break;
      case AddressingModes.DirectPageIndexedY:
        address =
          (this._memRead(this._regPC.get() + 1) + this._regY.get()) & 0xff;
        break;
      case AddressingModes.DirectPageIndexedIndirectX:
        address = this._read16Bug(
          this._memRead(this._regPC.get() + 1) + this._regX.get()
        );
        break;
      case AddressingModes.DirectPageIndirectIndexedY:
        address =
          this._read16Bug(this._memRead(this._regPC.get() + 1)) +
          this._regY.get();
        break;
      case AddressingModes.Implicit:
        address = 0;
        break;
      case AddressingModes.Accumulator:
        address = 0;
        break;
      case AddressingModes.Relative:
        const offset = this._memRead(this._regPC.get() + 1);
        if (offset < 0x80) {
          address = this._regPC.get() + 2 + offset;
        } else {
          address = this._regPC.get() + 2 + offset - 0x100;
        }
        break;
    }

    return { address, pageCrossed };
  }

  public handleOp(opCode: number) {
    let addressInfo = this._getAddressFromMode(OpAddressingMode[opCode]);

    this._regPC.add(InstructionSizes[opCode]);
    this._currentCycles += Cycles[opCode];
    if (addressInfo.pageCrossed) {
      this._currentCycles += PageCycles[opCode];
    }

    this._context = {
      PC: this._regPC.get(),
      Address: addressInfo.address,
      Mode: OpAddressingMode[opCode]
    };

    switch (opCode) {
      case 0x00:
        this.brk();
        break;
      case 0x01:
      case 0x05:
      case 0x09:
      case 0x0d:
      case 0x11:
      case 0x15:
      case 0x19:
      case 0x1d:
        this.ora();
        break;
      case 0x06:
      case 0x0a:
      case 0x0e:
      case 0x16:
      case 0x1e:
        this.asl();
        break;
      case 0x08:
        this.php();
        break;
      case 0x0c:
      case 0x1c:
      case 0x3c:
      case 0x5c:
      case 0x7c:
      case 0xdc:
      case 0xfc:
      case 0x04:
      case 0x44:
      case 0x64:
      case 0x14:
      case 0x34:
      case 0x54:
      case 0x74:
      case 0xd4:
      case 0xf4:
        this.ign();
        break;
      case 0x10:
        this.bpl();
        break;
      case 0x18:
        this.clc();
        break;
      case 0x20:
        this.jsr();
        break;
      case 0x21:
      case 0x25:
      case 0x29:
      case 0x2d:
      case 0x31:
      case 0x35:
      case 0x39:
      case 0x3d:
        this.and();
        break;
      case 0x24:
      case 0x2c:
        this.bit();
        break;
      case 0x26:
      case 0x2a:
      case 0x2e:
      case 0x36:
      case 0x3e:
        this.rol();
        break;
      case 0x28:
        this.plp();
        break;
      case 0x30:
        this.bmi();
        break;
      case 0x38:
        this.sec();
        break;
      case 0x40:
        this.rti();
        break;
      case 0x41:
      case 0x45:
      case 0x49:
      case 0x4d:
      case 0x51:
      case 0x55:
      case 0x59:
      case 0x5d:
        this.eor();
        break;
      case 0x46:
      case 0x4a:
      case 0x4e:
      case 0x56:
      case 0x5e:
        this.lsr();
        break;
      case 0x48:
        this.pha();
        break;
      case 0x4c:
      case 0x6c:
        this.jmp();
        break;
      case 0x50:
        this.bvc();
        break;
      case 0x58:
        this.cli();
        break;
      case 0x60:
        this.rts();
        break;
      case 0x61:
      case 0x65:
      case 0x69:
      case 0x6d:
      case 0x71:
      case 0x75:
      case 0x79:
      case 0x7d:
        this.adc();
        break;
      case 0x66:
      case 0x6a:
      case 0x6e:
      case 0x76:
      case 0x7e:
        this.ror();
        break;
      case 0x68:
        this.pla();
        break;
      case 0x70:
        this.bvs();
        break;
      case 0x78:
        this.sei();
        break;
      case 0x81:
      case 0x85:
      case 0x8d:
      case 0x91:
      case 0x95:
      case 0x99:
      case 0x9d:
        this.sta();
        break;
      case 0x84:
      case 0x8c:
      case 0x94:
        this.sty();
        break;
      case 0x86:
      case 0x8e:
      case 0x96:
        this.stx();
        break;
      case 0x88:
        this.dey();
        break;
      case 0x8a:
        this.txa();
        break;
      case 0x90:
        this.bcc();
        break;
      case 0x98:
        this.tya();
        break;
      case 0x9a:
        this.txs();
        break;
      case 0xa0:
      case 0xa4:
      case 0xac:
      case 0xb4:
      case 0xbc:
        this.ldy();
        break;
      case 0xa1:
      case 0xa5:
      case 0xa9:
      case 0xad:
      case 0xb1:
      case 0xb5:
      case 0xb9:
      case 0xbd:
        this.lda();
        break;
      case 0xa2:
      case 0xa6:
      case 0xae:
      case 0xb6:
      case 0xbe:
        this.ldx();
        break;
      case 0xa8:
        this.tay();
        break;
      case 0xaa:
        this.tax();
        break;
      case 0xb0:
        this.bcs();
        break;
      case 0xb8:
        this.clv();
        break;
      case 0xba:
        this.tsx();
        break;
      case 0xc0:
      case 0xc4:
      case 0xcc:
        this.cpy();
        break;
      case 0xc1:
      case 0xc5:
      case 0xc9:
      case 0xcd:
      case 0xd1:
      case 0xd5:
      case 0xd9:
      case 0xdd:
        this.cmp();
        break;
      case 0xc6:
      case 0xce:
      case 0xd6:
      case 0xde:
        this.dec();
        break;
      case 0xc8:
        this.iny();
        break;
      case 0xca:
        this.dex();
        break;
      case 0xd0:
        this.bne();
        break;
      case 0xd8:
        this.cld();
        break;
      case 0xe0:
      case 0xe4:
      case 0xec:
        this.cpx();
        break;
      case 0xe1:
      case 0xe5:
      case 0xeb:
      case 0xe9:
      case 0xed:
      case 0xf1:
      case 0xf5:
      case 0xf9:
      case 0xfd:
        this.sbc();
        break;
      case 0xe6:
      case 0xee:
      case 0xf6:
      case 0xfe:
        this.inc();
        break;
      case 0xe8:
        this.inx();
        break;
      case 0x1a:
      case 0x3a:
      case 0x5a:
      case 0x7a:
      case 0xda:
      case 0xfa:
      case 0xea:
        this.nop();
        break;
      case 0x80:
      case 0x82:
      case 0x89:
      case 0xc2:
      case 0xe2:
        this.skb();
        break;
      case 0xf0:
        this.beq();
        break;
      case 0xf8:
        this.sed();
        break;
      case 0xa3:
      case 0xa7:
      case 0xaf:
      case 0xb3:
      case 0xb7:
      case 0xbf:
        this.lax();
        break;
      case 0x83:
      case 0x87:
      case 0x8f:
      case 0x97:
        this.sax();
        break;
      case 0xc3:
      case 0xc7:
      case 0xcf:
      case 0xd3:
      case 0xd7:
      case 0xdb:
      case 0xdf:
        this.dcp();
        break;
      case 0xe3:
      case 0xe7:
      case 0xef:
      case 0xf3:
      case 0xf7:
      case 0xfb:
      case 0xff:
        this.isb();
        break;
      case 0x03:
      case 0x07:
      case 0x0f:
      case 0x13:
      case 0x17:
      case 0x1b:
      case 0x1f:
        this.slo();
        break;
      case 0x23:
      case 0x27:
      case 0x2f:
      case 0x33:
      case 0x37:
      case 0x3b:
      case 0x3f:
        this.rla();
        break;
      case 0x43:
      case 0x47:
      case 0x4f:
      case 0x53:
      case 0x57:
      case 0x5b:
      case 0x5f:
        this.sre();
        break;
      case 0x63:
      case 0x67:
      case 0x6f:
      case 0x73:
      case 0x77:
      case 0x7b:
      case 0x7f:
        this.rra();
        break;
      default:
        break;
    }
  }
}

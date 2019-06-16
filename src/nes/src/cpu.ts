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
  PageCycles,
  OpLabel
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

  private _log: string[];

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

    this._log = [];
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
  public getCurrentCycles(): number {
    return this._currentCycles;
  }
  public clearCycles() {
    this._currentCycles = 0;
  }
  public powerUp(): void {
    this._regP.set(0x24);
    this._regSP.set(0x01fd);
    this._regA.set(0);
    this._regX.set(0);
    this._regY.set(0);

    for (let i = 0x0000; i <= 0x07ff; i++) {
      this.memWrite(i, 0xff);
    }

    // Perform the RESET Interrupt
    this._interruptReset();
    this._setCurrentContext(0, AddressingModes.Immediate);
  }
  public requestInterrupt(interruptRequestType: InterruptRequestType) {
    this._interrupt = interruptRequestType;
  }

  private _setCurrentContext(address: number, addressingMode: AddressingModes) {
    this._context = {
      PC: this._regPC.get(),
      Address: address,
      Mode: addressingMode
    };
  }

  private _interruptReset(): void {
    const currPcLow = this._regPC.get() & 0xff;
    const currPcHigh = (this._regPC.get() >>> 8) & 0xff;

    this._stackPush(currPcHigh);
    this._stackPush(currPcLow);
    this._stackPush(this._regP.get());

    this.setStatusBit(StatusBitPositions.InterruptDisable);

    this._regPC.set(
      (this.memRead(ResetVectorLocation.High) << 8) |
        this.memRead(ResetVectorLocation.Low)
    );

    this.setStatusBit(StatusBitPositions.InterruptDisable);

    this._currentCycles += 7;
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
      return (
        (modifiedFirst & 0xff) - (modifiedSecond & 0xff) - modifiedCarry >= 0
      );
    }
  }

  private _logInstruction() {
    const opCode = this.memRead(this._regPC.get());
    const bytes = InstructionSizes[opCode];
    const name = OpLabel[opCode];

    let fmtOp0 = this.memRead(this._regPC.get())
      .toString(16)
      .toUpperCase();
    if (fmtOp0.length < 2) {
      fmtOp0 = `0${fmtOp0}`;
    }

    let fmtOp1 = this.memRead(this._regPC.get() + 1)
      .toString(16)
      .toUpperCase();
    if (fmtOp1.length < 2) {
      fmtOp1 = `0${fmtOp1}`;
    }

    let fmtOp2 = this.memRead(this._regPC.get() + 2)
      .toString(16)
      .toUpperCase();
    if (fmtOp2.length < 2) {
      fmtOp2 = `0${fmtOp2}`;
    }

    if (bytes < 2) {
      fmtOp1 = "  ";
    }
    if (bytes < 3) {
      fmtOp2 = "  ";
    }

    if (this._log.length > 30000) {
      this._log = [];
    }

    let fmtA = this._regA
      .get()
      .toString(16)
      .toUpperCase();
    if (fmtA.length < 2) {
      fmtA = `0${fmtA}`;
    }

    let fmtX = this._regX
      .get()
      .toString(16)
      .toUpperCase();
    if (fmtX.length < 2) {
      fmtX = `0${fmtX}`;
    }

    let fmtY = this._regY
      .get()
      .toString(16)
      .toUpperCase();
    if (fmtY.length < 2) {
      fmtY = `0${fmtY}`;
    }

    let fmtP = this._regP
      .get()
      .toString(16)
      .toUpperCase();
    if (fmtP.length < 2) {
      fmtP = `0${fmtP}`;
    }

    let fmtSP = this._regSP
      .get()
      .toString(16)
      .toUpperCase();
    if (fmtSP.length < 2) {
      fmtSP = `0${fmtSP}`;
    }

    let fmtPC = this._regPC
      .get()
      .toString(16)
      .toUpperCase();
    while (fmtPC.length < 4) {
      fmtPC = `0${fmtPC}`;
    }

    this._log.push(
      `${fmtPC}     ${fmtOp0} ${fmtOp1} ${fmtOp2}     ${name} ${fmtOp2}${fmtOp1}          A:${fmtA} X:${fmtX} Y:${fmtY} P:${fmtP} SP:${fmtSP}`
    );
  }

  public memWrite(address: number, data: number) {
    this._memory.set(address, data);
  }

  public memRead(address: number): number {
    return this._memory.get(address);
  }

  private _stackPush(data: number): void {
    this.memWrite(0x100 | this._regSP.get(), data);
    this._regSP.set(this._regSP.get() - 1);
  }

  private _stackPull(): number {
    this._regSP.set(this._regSP.get() + 1);
    return this.memRead(0x100 | this._regSP.get());
  }

  private _read16(address: number): number {
    const low = this.memRead(address);
    const high = this.memRead(address + 1);

    return ((high << 8) | low) & 0xffff;
  }

  private _read16Bug(address: number): number {
    const a = address;
    const b = (a & 0xff00) | (((a & 0xff) + 1) & 0xff);
    const low = this.memRead(a);
    const high = this.memRead(b);

    const effAddress = ((high << 8) | low) & 0xffff;

    return effAddress;
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

  public _handleNmi() {
    const currPcLow = this._regPC.get() & 0xff;
    const currPcHigh = (this._regPC.get() >>> 8) & 0xff;
    this._stackPush(currPcHigh);
    this._stackPush(currPcLow);

    this._php();

    this.setStatusBit(StatusBitPositions.InterruptDisable);
    this._regPC.set(
      (this.memRead(NmiVectorLocation.High) << 8) |
        this.memRead(NmiVectorLocation.Low)
    );
    this._currentCycles += 7;
    this._interrupt = InterruptRequestType.None;
  }

  public irq() {
    const currPcLow = this._regPC.get() & 0xff;
    const currPcHigh = (this._regPC.get() >>> 8) & 0xff;
    this._stackPush(currPcHigh);
    this._stackPush(currPcLow);

    this._php();
    this.setStatusBit(StatusBitPositions.InterruptDisable);
    this._regPC.set(
      (this.memRead(IrqVectorLocation.High) << 8) |
        this.memRead(IrqVectorLocation.Low)
    );
    this._currentCycles += 7;
    this._interrupt = InterruptRequestType.None;
  }

  private _adc() {
    const a = this._regA.get();
    const b = this.memRead(this._context.Address);
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

  private _and() {
    this._regA.set(this._regA.get() & this.memRead(this._context.Address));
    this._setZero(this._regA.get());
    this._setNegative(this._regA.get());
  }

  private _asl() {
    let carry: number;
    let result: number;

    if (this._context.Mode === AddressingModes.Accumulator) {
      carry = (this._regA.get() >>> 7) & 1;
      this._regA.set(this._regA.get() << 1);
      result = this._regA.get();
    } else {
      const operand = this.memRead(this._context.Address);
      carry = (operand >>> 7) & 1;
      result = operand << 1;

      this.memWrite(this._context.Address, result);
    }

    if (carry === 1) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }

    this._setNegative(result);
    this._setZero(result);
  }

  private _bcc() {
    if (!this.getStatusBitFlag(StatusBitPositions.Carry)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  private _bcs() {
    if (this.getStatusBitFlag(StatusBitPositions.Carry)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  private _beq() {
    if (this.getStatusBitFlag(StatusBitPositions.Zero)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  private _bit() {
    const value = this.memRead(this._context.Address);
    const overflow = (value >>> 6) & 1;

    if (overflow > 0) {
      this.setStatusBit(StatusBitPositions.Overflow);
    } else {
      this.clearStatusBit(StatusBitPositions.Overflow);
    }

    this._setZero(value & this._regA.get());
    this._setNegative(value);
  }

  private _bmi() {
    if (this.getStatusBitFlag(StatusBitPositions.Negative)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  private _bne() {
    if (!this.getStatusBitFlag(StatusBitPositions.Zero)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  private _bpl() {
    if (!this.getStatusBitFlag(StatusBitPositions.Negative)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  private _brk() {
    this._stackPush((this._regPC.get() & 0xff00) >>> 8);
    this._stackPush(this._regPC.get() & 0x00ff);
    this._php();
    this._sei();

    let interruptVectorLow = this.memRead(IrqVectorLocation.Low);
    let interruptVectorHigh = this.memRead(IrqVectorLocation.High);

    this._regPC.set((interruptVectorHigh << 8) | interruptVectorLow);

    this._interrupt = InterruptRequestType.None;
  }

  private _bvc() {
    if (!this.getStatusBitFlag(StatusBitPositions.Overflow)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  private _bvs() {
    if (this.getStatusBitFlag(StatusBitPositions.Overflow)) {
      this._regPC.set(this._context.Address);
      this._addBranchCycles(this._context);
    }
  }

  private _clc() {
    this.clearStatusBit(StatusBitPositions.Carry);
  }

  private _cld() {
    this.clearStatusBit(StatusBitPositions.DecimalMode);
  }

  private _cli() {
    this.clearStatusBit(StatusBitPositions.InterruptDisable);
  }

  private _clv() {
    this.clearStatusBit(StatusBitPositions.Overflow);
  }

  private _cmp() {
    const value = this.memRead(this._context.Address);
    this._compare(this._regA.get(), value);
  }

  private _cpx() {
    const value = this.memRead(this._context.Address);
    this._compare(this._regX.get(), value);
  }

  private _cpy() {
    const value = this.memRead(this._context.Address);
    this._compare(this._regY.get(), value);
  }

  private _dec() {
    const value = this.memRead(this._context.Address) - 1;
    this.memWrite(this._context.Address, value);
    this._setZero(value);
    this._setNegative(value);
  }

  private _dex() {
    this._regX.set(this._regX.get() - 1);
    this._setZero(this._regX.get());
    this._setNegative(this._regX.get());
  }

  private _dey() {
    this._regY.set(this._regY.get() - 1);
    this._setZero(this._regY.get());
    this._setNegative(this._regY.get());
  }

  private _eor() {
    const result = this._regA.get() ^ this.memRead(this._context.Address);
    this._regA.set(result);
    this._setNegative(result);
    this._setZero(result);
  }

  private _inc() {
    const value = this.memRead(this._context.Address) + 1;
    this.memWrite(this._context.Address, value);
    this._setZero(value);
    this._setNegative(value);
  }

  private _inx() {
    this._regX.set(this._regX.get() + 1);
    this._setZero(this._regX.get());
    this._setNegative(this._regX.get());
  }

  private _iny() {
    this._regY.set(this._regY.get() + 1);
    this._setZero(this._regY.get());
    this._setNegative(this._regY.get());
  }

  private _jmp() {
    this._regPC.set(this._context.Address);
  }

  private _jsr() {
    const startAddr = this._regPC.get() - 1;
    this._stackPush((startAddr & 0xff00) >>> 8);
    this._stackPush(startAddr & 0x00ff);
    this._regPC.set(this._context.Address);
  }

  private _lda() {
    this._regA.set(this.memRead(this._context.Address));
    this._setNegative(this._regA.get());
    this._setZero(this._regA.get());
  }

  private _ldx() {
    this._regX.set(this.memRead(this._context.Address));
    this._setNegative(this._regX.get());
    this._setZero(this._regX.get());
  }

  private _ldy() {
    this._regY.set(this.memRead(this._context.Address));
    this._setNegative(this._regY.get());
    this._setZero(this._regY.get());
  }

  private _lsr() {
    let carry: number;
    let result: number;

    if (this._context.Mode === AddressingModes.Accumulator) {
      carry = this._regA.get() & 1;
      this._regA.set(this._regA.get() >>> 1);
      result = this._regA.get();
    } else {
      const value = this.memRead(this._context.Address);
      carry = value & 1;
      result = value >>> 1;
      this.memWrite(this._context.Address, result);
    }

    this._setNegative(result);
    this._setZero(result);

    if (carry === 1) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }
  }

  private _nop() {
    // noop
  }

  private _ora() {
    this._regA.set(this._regA.get() | this.memRead(this._context.Address));
    this._setNegative(this._regA.get());
    this._setZero(this._regA.get());
  }

  private _pha() {
    this._stackPush(this._regA.get());
  }

  private _php() {
    let pStatus = this._regP.get() | 0x10;
    this._stackPush(pStatus);
  }

  private _pla() {
    this._regA.set(this._stackPull());
    this._setNegative(this._regA.get());
    this._setZero(this._regA.get());
  }

  private _plp() {
    let pStatus = (this._stackPull() & 0xef) | 0x20;
    this._regP.set(pStatus);
  }

  public _rol() {
    const currCarry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;
    let newCarry: number;
    let result: number;

    if (this._context.Mode === AddressingModes.Accumulator) {
      newCarry = (this._regA.get() >>> 7) & 1;
      this._regA.set((this._regA.get() << 1) | currCarry);

      result = this._regA.get();
    } else {
      const value = this.memRead(this._context.Address);
      newCarry = (value >>> 7) & 1;

      result = (value << 1) | currCarry;

      this.memWrite(this._context.Address, result);
    }

    this._setNegative(result);
    this._setZero(result);

    if (newCarry === 1) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }
  }

  public _ror() {
    const currCarry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;
    let newCarry: number;
    let result: number;

    if (this._context.Mode === AddressingModes.Accumulator) {
      newCarry = this._regA.get() & 1;
      this._regA.set((this._regA.get() >>> 1) | (currCarry << 7));

      result = this._regA.get();
    } else {
      const value = this.memRead(this._context.Address);
      newCarry = value & 1;

      result = (value >>> 1) | (currCarry << 7);

      this.memWrite(this._context.Address, result);
    }

    this._setNegative(result);
    this._setZero(result);

    if (newCarry === 1) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }
  }

  private _rti() {
    const newP = (this._stackPull() & 0xef) | 0x20;
    const pcLow = this._stackPull();
    const pcHigh = this._stackPull();

    this._regPC.set((pcHigh << 8) | pcLow);
    this._regP.set(newP);
  }

  public _rts() {
    const newLowPC = this._stackPull();
    const newHighPC = this._stackPull();
    this._regPC.set(((newHighPC << 8) | newLowPC) + 1);
  }

  public _sbc() {
    const a = this._regA.get();
    const b = this.memRead(this._context.Address);
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

  public _sec() {
    this.setStatusBit(StatusBitPositions.Carry);
  }

  public _sed() {
    this.setStatusBit(StatusBitPositions.DecimalMode);
  }

  public _sei() {
    this.setStatusBit(StatusBitPositions.InterruptDisable);
  }

  public _sta() {
    this.memWrite(this._context.Address, this._regA.get());
  }

  public _stx() {
    this.memWrite(this._context.Address, this._regX.get());
  }

  public _sty() {
    this.memWrite(this._context.Address, this._regY.get());
  }

  private _tax() {
    this._regX.set(this._regA.get());
    this._setNegative(this._regX.get());
    this._setZero(this._regX.get());
  }

  private _tay() {
    this._regY.set(this._regA.get());
    this._setNegative(this._regY.get());
    this._setZero(this._regY.get());
  }

  private _tsx() {
    this._regX.set(this._regSP.get());
    this._setNegative(this._regX.get());
    this._setZero(this._regX.get());
  }

  private _txa() {
    this._regA.set(this._regX.get());
    this._setNegative(this._regA.get());
    this._setZero(this._regA.get());
  }

  private _txs() {
    this._regSP.set(this._regX.get());
  }

  private _tya() {
    this._regA.set(this._regY.get());
    this._setNegative(this._regA.get());
    this._setZero(this._regA.get());
  }

  private _dcp() {}
  private _ign() {}
  private _isb() {}
  private _lax() {}
  private _rla() {}
  private _rra() {}
  private _sax() {}
  private _skb() {}
  private _slo() {}
  private _sre() {}

  private _runStallCycle() {
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
        address = this.memRead(this._regPC.get() + 1);
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
          (this.memRead(this._regPC.get() + 1) + this._regX.get()) & 0xff;
        break;
      case AddressingModes.DirectPageIndexedY:
        address =
          (this.memRead(this._regPC.get() + 1) + this._regY.get()) & 0xff;
        break;
      case AddressingModes.DirectPageIndexedIndirectX:
        address = this._read16Bug(
          this.memRead(this._regPC.get() + 1) + this._regX.get()
        );
        break;
      case AddressingModes.DirectPageIndirectIndexedY:
        address =
          this._read16Bug(this.memRead(this._regPC.get() + 1)) +
          this._regY.get();
        pageCrossed = this._crossesPageBoundary(
          address - this._regY.get(),
          address
        );
        break;
      case AddressingModes.Implicit:
        address = 0;
        break;
      case AddressingModes.Accumulator:
        address = 0;
        break;
      case AddressingModes.Relative:
        const offset = this.memRead(this._regPC.get() + 1);
        if (offset < 0x80) {
          address = this._regPC.get() + 2 + offset;
        } else {
          address = this._regPC.get() + 2 + offset - 0x100;
        }
        break;
    }

    return { address: address & 0xffff, pageCrossed };
  }

  public getLog() {
    return JSON.stringify(this._log);
  }

  // Returns cycles ran
  public step(): number {
    const prevCurrentCycles = this._currentCycles;

    if (this._stallCycles > 0) {
      this._runStallCycle();
      return this._currentCycles - prevCurrentCycles;
    }

    // this._logInstruction();

    if (this._interrupt === InterruptRequestType.NMI) {
      this._handleNmi();
    } else if (
      this._interrupt === InterruptRequestType.IRQ &&
      !this.getStatusBitFlag(StatusBitPositions.InterruptDisable)
    ) {
      this.irq();
    }
    this._interrupt = InterruptRequestType.None;

    const op = this._memory.get(this._regPC.get());

    let addressInfo = this._getAddressFromMode(OpAddressingMode[op]);

    this._regPC.add(InstructionSizes[op]);
    this._currentCycles += Cycles[op];
    if (addressInfo.pageCrossed) {
      this._currentCycles += PageCycles[op];
    }

    this._setCurrentContext(addressInfo.address, OpAddressingMode[op]);

    this.handleOp(op);

    return this._currentCycles - prevCurrentCycles;
  }

  public handleOp(opCode: number) {
    switch (opCode) {
      case 0x00:
        this._brk();
        break;
      case 0x01:
      case 0x05:
      case 0x09:
      case 0x0d:
      case 0x11:
      case 0x15:
      case 0x19:
      case 0x1d:
        this._ora();
        break;
      case 0x06:
      case 0x0a:
      case 0x0e:
      case 0x16:
      case 0x1e:
        this._asl();
        break;
      case 0x08:
        this._php();
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
        this._ign();
        break;
      case 0x10:
        this._bpl();
        break;
      case 0x18:
        this._clc();
        break;
      case 0x20:
        this._jsr();
        break;
      case 0x21:
      case 0x25:
      case 0x29:
      case 0x2d:
      case 0x31:
      case 0x35:
      case 0x39:
      case 0x3d:
        this._and();
        break;
      case 0x24:
      case 0x2c:
        this._bit();
        break;
      case 0x26:
      case 0x2a:
      case 0x2e:
      case 0x36:
      case 0x3e:
        this._rol();
        break;
      case 0x28:
        this._plp();
        break;
      case 0x30:
        this._bmi();
        break;
      case 0x38:
        this._sec();
        break;
      case 0x40:
        this._rti();
        break;
      case 0x41:
      case 0x45:
      case 0x49:
      case 0x4d:
      case 0x51:
      case 0x55:
      case 0x59:
      case 0x5d:
        this._eor();
        break;
      case 0x46:
      case 0x4a:
      case 0x4e:
      case 0x56:
      case 0x5e:
        this._lsr();
        break;
      case 0x48:
        this._pha();
        break;
      case 0x4c:
      case 0x6c:
        this._jmp();
        break;
      case 0x50:
        this._bvc();
        break;
      case 0x58:
        this._cli();
        break;
      case 0x60:
        this._rts();
        break;
      case 0x61:
      case 0x65:
      case 0x69:
      case 0x6d:
      case 0x71:
      case 0x75:
      case 0x79:
      case 0x7d:
        this._adc();
        break;
      case 0x66:
      case 0x6a:
      case 0x6e:
      case 0x76:
      case 0x7e:
        this._ror();
        break;
      case 0x68:
        this._pla();
        break;
      case 0x70:
        this._bvs();
        break;
      case 0x78:
        this._sei();
        break;
      case 0x81:
      case 0x85:
      case 0x8d:
      case 0x91:
      case 0x95:
      case 0x99:
      case 0x9d:
        this._sta();
        break;
      case 0x84:
      case 0x8c:
      case 0x94:
        this._sty();
        break;
      case 0x86:
      case 0x8e:
      case 0x96:
        this._stx();
        break;
      case 0x88:
        this._dey();
        break;
      case 0x8a:
        this._txa();
        break;
      case 0x90:
        this._bcc();
        break;
      case 0x98:
        this._tya();
        break;
      case 0x9a:
        this._txs();
        break;
      case 0xa0:
      case 0xa4:
      case 0xac:
      case 0xb4:
      case 0xbc:
        this._ldy();
        break;
      case 0xa1:
      case 0xa5:
      case 0xa9:
      case 0xad:
      case 0xb1:
      case 0xb5:
      case 0xb9:
      case 0xbd:
        this._lda();
        break;
      case 0xa2:
      case 0xa6:
      case 0xae:
      case 0xb6:
      case 0xbe:
        this._ldx();
        break;
      case 0xa8:
        this._tay();
        break;
      case 0xaa:
        this._tax();
        break;
      case 0xb0:
        this._bcs();
        break;
      case 0xb8:
        this._clv();
        break;
      case 0xba:
        this._tsx();
        break;
      case 0xc0:
      case 0xc4:
      case 0xcc:
        this._cpy();
        break;
      case 0xc1:
      case 0xc5:
      case 0xc9:
      case 0xcd:
      case 0xd1:
      case 0xd5:
      case 0xd9:
      case 0xdd:
        this._cmp();
        break;
      case 0xc6:
      case 0xce:
      case 0xd6:
      case 0xde:
        this._dec();
        break;
      case 0xc8:
        this._iny();
        break;
      case 0xca:
        this._dex();
        break;
      case 0xd0:
        this._bne();
        break;
      case 0xd8:
        this._cld();
        break;
      case 0xe0:
      case 0xe4:
      case 0xec:
        this._cpx();
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
        this._sbc();
        break;
      case 0xe6:
      case 0xee:
      case 0xf6:
      case 0xfe:
        this._inc();
        break;
      case 0xe8:
        this._inx();
        break;
      case 0x1a:
      case 0x3a:
      case 0x5a:
      case 0x7a:
      case 0xda:
      case 0xfa:
      case 0xea:
        this._nop();
        break;
      case 0x80:
      case 0x82:
      case 0x89:
      case 0xc2:
      case 0xe2:
        this._skb();
        break;
      case 0xf0:
        this._beq();
        break;
      case 0xf8:
        this._sed();
        break;
      case 0xa3:
      case 0xa7:
      case 0xaf:
      case 0xb3:
      case 0xb7:
      case 0xbf:
        this._lax();
        break;
      case 0x83:
      case 0x87:
      case 0x8f:
      case 0x97:
        this._sax();
        break;
      case 0xc3:
      case 0xc7:
      case 0xcf:
      case 0xd3:
      case 0xd7:
      case 0xdb:
      case 0xdf:
        this._dcp();
        break;
      case 0xe3:
      case 0xe7:
      case 0xef:
      case 0xf3:
      case 0xf7:
      case 0xfb:
      case 0xff:
        this._isb();
        break;
      case 0x03:
      case 0x07:
      case 0x0f:
      case 0x13:
      case 0x17:
      case 0x1b:
      case 0x1f:
        this._slo();
        break;
      case 0x23:
      case 0x27:
      case 0x2f:
      case 0x33:
      case 0x37:
      case 0x3b:
      case 0x3f:
        this._rla();
        break;
      case 0x43:
      case 0x47:
      case 0x4f:
      case 0x53:
      case 0x57:
      case 0x5b:
      case 0x5f:
        this._sre();
        break;
      case 0x63:
      case 0x67:
      case 0x6f:
      case 0x73:
      case 0x77:
      case 0x7b:
      case 0x7f:
        this._rra();
        break;
      default:
        break;
    }
  }
}

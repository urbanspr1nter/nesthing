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
  CpuRegisters,
  CycleContext
} from "./cpu.interface";

export interface CpuState {
  registers: CpuRegisters;
  currentCycles: number;
  stallCycles: number;
  interrupt: InterruptRequestType;
  context: CycleContext;
}

export class Cpu {
  private _registers: CpuRegisters;
  private _memory: Memory;
  private _currentCycles: number;
  private _stallCycles: number;
  private _interrupt: InterruptRequestType;
  private _context: CycleContext;

  constructor(memory: Memory) {
    this._registers = {
      X: 0,
      Y: 0,
      A: 0,
      P: 0,
      PC: 0,
      SP: 0
    };

    this._currentCycles = 0;
    this._memory = memory;
    this._interrupt = InterruptRequestType.None;
    this._stallCycles = 0;
    this._setCurrentContext(0, AddressingModes.Immediate);
  }

  public load(state: CpuState) {
    this._registers = state.registers;
    this._currentCycles = state.currentCycles;
    this._stallCycles = state.stallCycles;
    this._interrupt = state.interrupt;
  }

  public save(): CpuState {
    return {
      registers: this._registers,
      currentCycles: this._currentCycles,
      stallCycles: this._stallCycles,
      interrupt: this._interrupt,
      context: this._context
    }
  }

  get memory() {
    return this._memory;
  }

  set stallCycles(cycles: number) {
    this._stallCycles = cycles;
  }

  get stallCycles() {
    return this._stallCycles;
  }

  get currentCycles() {
    return this._currentCycles;
  }

  public powerUp(): void {
    this.P = 0x24;
    this.SP = 0x01fd;

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
    if(this._context === undefined) {
      this._context = {
        PC: 0,
        Address: 0,
        Mode: AddressingModes.Immediate
      };
    }
    
    this._context.PC = this.PC;
    this._context.Address = address & 0xffff;
    this._context.Mode = addressingMode;
  }

  private _interruptReset(): void {
    const currPcLow = this.PC & 0xff;
    const currPcHigh = (this.PC >>> 8) & 0xff;

    this._stackPush(currPcHigh);
    this._stackPush(currPcLow);
    this._stackPush(this.P);

    this.setStatusBit(StatusBitPositions.InterruptDisable);

    this.PC =
      (this.memRead(ResetVectorLocation.High) << 8) |
      this.memRead(ResetVectorLocation.Low);

    this.setStatusBit(StatusBitPositions.InterruptDisable);

    this._currentCycles += 7;
  }

  private get A() {
    return this._registers.A;
  }
  private get X() {
    return this._registers.X;
  }
  private get Y() {
    return this._registers.Y;
  }
  private get PC() {
    return this._registers.PC;
  }
  private get SP() {
    return this._registers.SP;
  }
  private get P() {
    return this._registers.P;
  }

  private set A(value: number) {
    this._registers.A = value & 0xff;
  }
  private set X(value: number) {
    this._registers.X = value & 0xff;
  }
  private set Y(value: number) {
    this._registers.Y = value & 0xff;
  }
  private set PC(value: number) {
    this._registers.PC = value & 0xffff;
  }
  private set SP(value: number) {
    this._registers.SP = value & 0xffff;
  }
  private set P(value: number) {
    this._registers.P = value & 0xff;
  }

  public setStatusBit(bit: StatusBitPositions): void {
    this.P = this.P | (1 << bit);
  }

  public clearStatusBit(bit: StatusBitPositions): void {
    this.P = this.P & ~(1 << bit);
  }

  public getStatusBitFlag(bit: StatusBitPositions): boolean {
    return (this.P & (1 << bit)) > 0;
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

  public memWrite(address: number, data: number) {
    this._memory.set(address, data);
  }

  public memRead(address: number): number {
    return this._memory.get(address);
  }

  private _stackPush(data: number): void {
    this.memWrite(0x100 | this.SP, data);
    this.SP = this.SP - 1;
  }

  private _stackPull(): number {
    this.SP = this.SP + 1;
    return this.memRead(0x100 | this.SP);
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

  private _handleNmi() {
    const currPcLow = this.PC & 0xff;
    const currPcHigh = (this.PC >>> 8) & 0xff;
    this._stackPush(currPcHigh);
    this._stackPush(currPcLow);

    this._php();

    this.setStatusBit(StatusBitPositions.InterruptDisable);
    this.PC =
      (this.memRead(NmiVectorLocation.High) << 8) |
      this.memRead(NmiVectorLocation.Low);
    this._currentCycles += 7;
    this._interrupt = InterruptRequestType.None;
  }

  private _irq() {
    const currPcLow = this.PC & 0xff;
    const currPcHigh = (this.PC >>> 8) & 0xff;
    this._stackPush(currPcHigh);
    this._stackPush(currPcLow);

    this._php();
    this.setStatusBit(StatusBitPositions.InterruptDisable);
    this.PC =
      (this.memRead(IrqVectorLocation.High) << 8) |
      this.memRead(IrqVectorLocation.Low);
    this._currentCycles += 7;
    this._interrupt = InterruptRequestType.None;
  }

  private _adc() {
    const a = this.A;
    const b = this.memRead(this._context.Address);
    const carry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;

    this.A = a + b + carry;

    this._setZero(this.A);
    this._setNegative(this.A);

    if (this.isCarry(a, b, carry, true)) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }

    if (this.isOverflow(a, b, this.A)) {
      this.setStatusBit(StatusBitPositions.Overflow);
    } else {
      this.clearStatusBit(StatusBitPositions.Overflow);
    }
  }

  private _and() {
    this.A = this.A & this.memRead(this._context.Address);
    this._setZero(this.A);
    this._setNegative(this.A);
  }

  private _asl() {
    let carry: number;
    let result: number;

    if (this._context.Mode === AddressingModes.Accumulator) {
      carry = (this.A >>> 7) & 1;
      this.A = this.A << 1;
      result = this.A;
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
      this.PC = this._context.Address;
      this._addBranchCycles(this._context);
    }
  }

  private _bcs() {
    if (this.getStatusBitFlag(StatusBitPositions.Carry)) {
      this.PC = this._context.Address;
      this._addBranchCycles(this._context);
    }
  }

  private _beq() {
    if (this.getStatusBitFlag(StatusBitPositions.Zero)) {
      this.PC = this._context.Address;
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

    this._setZero(value & this.A);
    this._setNegative(value);
  }

  private _bmi() {
    if (this.getStatusBitFlag(StatusBitPositions.Negative)) {
      this.PC = this._context.Address;
      this._addBranchCycles(this._context);
    }
  }

  private _bne() {
    if (!this.getStatusBitFlag(StatusBitPositions.Zero)) {
      this.PC = this._context.Address;
      this._addBranchCycles(this._context);
    }
  }

  private _bpl() {
    if (!this.getStatusBitFlag(StatusBitPositions.Negative)) {
      this.PC = this._context.Address;
      this._addBranchCycles(this._context);
    }
  }

  private _brk() {
    this._stackPush(this.PC >>> 8);
    this._stackPush(this.PC & 0x00ff);
    this._php();
    this._sei();

    let interruptVectorLow = this.memRead(IrqVectorLocation.Low);
    let interruptVectorHigh = this.memRead(IrqVectorLocation.High);

    this.PC = (interruptVectorHigh << 8) | interruptVectorLow;

    this._interrupt = InterruptRequestType.None;
  }

  private _bvc() {
    if (!this.getStatusBitFlag(StatusBitPositions.Overflow)) {
      this.PC = this._context.Address;
      this._addBranchCycles(this._context);
    }
  }

  private _bvs() {
    if (this.getStatusBitFlag(StatusBitPositions.Overflow)) {
      this.PC = this._context.Address;
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
    this._compare(this.A, value);
  }

  private _cpx() {
    const value = this.memRead(this._context.Address);
    this._compare(this.X, value);
  }

  private _cpy() {
    const value = this.memRead(this._context.Address);
    this._compare(this.Y, value);
  }

  private _dec() {
    const value = this.memRead(this._context.Address) - 1;
    this.memWrite(this._context.Address, value);
    this._setZero(value);
    this._setNegative(value);
  }

  private _dex() {
    this.X = this.X - 1;
    this._setZero(this.X);
    this._setNegative(this.X);
  }

  private _dey() {
    this.Y = this.Y - 1;
    this._setZero(this.Y);
    this._setNegative(this.Y);
  }

  private _eor() {
    const result = this.A ^ this.memRead(this._context.Address);
    this.A = result;
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
    this.X = this.X + 1;
    this._setZero(this.X);
    this._setNegative(this.X);
  }

  private _iny() {
    this.Y = this.Y + 1;
    this._setZero(this.Y);
    this._setNegative(this.Y);
  }

  private _jmp() {
    this.PC = this._context.Address;
  }

  private _jsr() {
    const startAddr = this.PC - 1;
    this._stackPush((startAddr & 0xff00) >>> 8);
    this._stackPush(startAddr & 0x00ff);
    this.PC = this._context.Address;
  }

  private _lda() {
    this.A = this.memRead(this._context.Address);
    this._setNegative(this.A);
    this._setZero(this.A);
  }

  private _ldx() {
    this.X = this.memRead(this._context.Address);
    this._setNegative(this.X);
    this._setZero(this.X);
  }

  private _ldy() {
    this.Y = this.memRead(this._context.Address);
    this._setNegative(this.Y);
    this._setZero(this.Y);
  }

  private _lsr() {
    let carry: number;
    let result: number;

    if (this._context.Mode === AddressingModes.Accumulator) {
      carry = this.A & 1;
      this.A = this.A >>> 1;
      result = this.A;
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
    this.A = this.A | this.memRead(this._context.Address);
    this._setNegative(this.A);
    this._setZero(this.A);
  }

  private _pha() {
    this._stackPush(this.A);
  }

  private _php() {
    let pStatus = this.P | 0x10;
    this._stackPush(pStatus);
  }

  private _pla() {
    this.A = this._stackPull();
    this._setNegative(this.A);
    this._setZero(this.A);
  }

  private _plp() {
    let pStatus = (this._stackPull() & 0xef) | 0x20;
    this.P = pStatus;
  }

  public _rol() {
    const currCarry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;
    let newCarry: number;
    let result: number;

    if (this._context.Mode === AddressingModes.Accumulator) {
      newCarry = (this.A >>> 7) & 1;
      this.A = (this.A << 1) | currCarry;

      result = this.A;
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
      newCarry = this.A & 1;
      this.A = (this.A >>> 1) | (currCarry << 7);

      result = this.A;
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

    this.PC = (pcHigh << 8) | pcLow;
    this.P = newP;
  }

  public _rts() {
    const newLowPC = this._stackPull();
    const newHighPC = this._stackPull();
    this.PC = ((newHighPC << 8) | newLowPC) + 1;
  }

  public _sbc() {
    const a = this.A;
    const b = this.memRead(this._context.Address);
    const carry = this.getStatusBitFlag(StatusBitPositions.Carry) ? 1 : 0;

    this.A = a - b - (1 - carry);

    this._setZero(this.A);
    this._setNegative(this.A);

    if (this.isCarry(a, b, 1 - carry, false)) {
      this.setStatusBit(StatusBitPositions.Carry);
    } else {
      this.clearStatusBit(StatusBitPositions.Carry);
    }

    if (this.isOverflow(a, b, this.A)) {
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
    this.memWrite(this._context.Address, this.A);
  }

  public _stx() {
    this.memWrite(this._context.Address, this.X);
  }

  public _sty() {
    this.memWrite(this._context.Address, this.Y);
  }

  private _tax() {
    this.X = this.A;
    this._setNegative(this.X);
    this._setZero(this.X);
  }

  private _tay() {
    this.Y = this.A;
    this._setNegative(this.Y);
    this._setZero(this.Y);
  }

  private _tsx() {
    this.X = this.SP;
    this._setNegative(this.X);
    this._setZero(this.X);
  }

  private _txa() {
    this.A = this.X;
    this._setNegative(this.A);
    this._setZero(this.A);
  }

  private _txs() {
    this.SP = this.X;
  }

  private _tya() {
    this.A = this.Y;
    this._setNegative(this.A);
    this._setZero(this.A);
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
        address = this.PC + 1;
        break;
      case AddressingModes.Absolute:
        address = this._read16(this.PC + 1);
        break;
      case AddressingModes.AbsoluteIndirect:
        address = this._read16Bug(this._read16(this.PC + 1));
        break;
      case AddressingModes.DirectPage:
        address = this.memRead(this.PC + 1);
        break;
      case AddressingModes.AbsoluteIndexedX:
        address = this._read16(this.PC + 1) + this.X;
        pageCrossed = this._crossesPageBoundary(address - this.X, address);
        break;
      case AddressingModes.AbsoluteIndexedY:
        address = this._read16(this.PC + 1) + this.Y;
        pageCrossed = this._crossesPageBoundary(address - this.Y, address);
        break;
      case AddressingModes.DirectPageIndexedX:
        address = (this.memRead(this.PC + 1) + this.X) & 0xff;
        break;
      case AddressingModes.DirectPageIndexedY:
        address = (this.memRead(this.PC + 1) + this.Y) & 0xff;
        break;
      case AddressingModes.DirectPageIndexedIndirectX:
        address = this._read16Bug(this.memRead(this.PC + 1) + this.X);
        break;
      case AddressingModes.DirectPageIndirectIndexedY:
        address = this._read16Bug(this.memRead(this.PC + 1)) + this.Y;
        pageCrossed = this._crossesPageBoundary(address - this.Y, address);
        break;
      case AddressingModes.Implicit:
        address = 0;
        break;
      case AddressingModes.Accumulator:
        address = 0;
        break;
      case AddressingModes.Relative:
        const offset = this.memRead(this.PC + 1);
        if (offset < 0x80) {
          address = this.PC + 2 + offset;
        } else {
          address = this.PC + 2 + offset - 0x100;
        }
        break;
    }

    return { address: address & 0xffff, pageCrossed };
  }

  // Returns cycles ran
  public step(): number {
    const prevCurrentCycles = this._currentCycles;

    if (this._stallCycles > 0) {
      this._runStallCycle();
      return this._currentCycles - prevCurrentCycles;
    }
    
    if (this._interrupt === InterruptRequestType.NMI) {
      this._handleNmi();
    } else if (
      this._interrupt === InterruptRequestType.IRQ &&
      !this.getStatusBitFlag(StatusBitPositions.InterruptDisable)
    ) {
      this._irq();
    }
    
    const op = this._memory.get(this.PC);

    let addressInfo = this._getAddressFromMode(OpAddressingMode[op]);

    this.PC = this.PC + InstructionSizes[op];
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

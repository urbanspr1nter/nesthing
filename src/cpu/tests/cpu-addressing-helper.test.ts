import { Memory } from '../../memory/memory';
import { CpuAddressingHelper } from '../cpu-addressing-helper';
import { ByteRegister } from '../byte-register';
import { DoubleByteRegister } from '../double-byte-register';
import * as assert from 'assert';

describe('CPU Addressing Mode Tests', () => {
    const mockPC = new DoubleByteRegister(0);
    const mockX = new ByteRegister(0);
    const mockY = new ByteRegister(0);

    const mmu = new Memory();
    const helper = new CpuAddressingHelper(mmu);

    it('Test Immediate Addressing Mode', () => {
        mockPC.set(0xC000);
        mmu.set(0xC000, 0x23);

        const result = mmu.get(helper.atImmediate(mockPC));

        assert.equal(result, 0x23);
    });

    it('Test Absolute Addressing Mode', () => {
        mockPC.set(0xC000);
        mmu.set(0xC000, 0x21);
        mmu.set(0xC001, 0x32);

        mmu.set(0x3221, 0x34);

        const result = mmu.get(helper.atAbsolute(mockPC));
        
        assert.equal(result, 0x34);
    });

    it('Test Direct Page Addressing Mode', () => {
        mockPC.set(0x3210);
        mmu.set(0x3210, 0xFA);

        mmu.set(0xFA, 0xBB);

        const result = mmu.get(helper.atDirectPage(mockPC));

        assert.equal(result, 0xBB);
    });

    it('Test Absolute Indexed, X Addressing Mode', () => {
        mockPC.set(0xC000);
        mockX.set(0xA3);

        mmu.set(0xC000, 0xD6);
        mmu.set(0xC001, 0x21);

        mmu.set(0x2279, 0x81);

        const result = mmu.get(helper.atAbsoluteIndexedX(mockPC, mockX));

        assert.equal(result, 0x81);
    });

    it('Test Absolute Indexed, Y Addressing Mode', () => {
        mockPC.set(0xC000);
        mockY.set(0xA4);

        mmu.set(0xC000, 0xD6);
        mmu.set(0xC001, 0x21);

        mmu.set(0x227A, 0x81);

        const result = mmu.get(helper.atAbsoluteIndexedX(mockPC, mockY));

        assert.equal(result, 0x81);
    });

    it('Test Direct Page Indexed, X Addressing Mode', () => {
        mockPC.set(0xC000);
        mockX.set(0xE9);

        mmu.set(0xC000, 0x51);

        mmu.set(0x3A, 0x42);
        const result = mmu.get(helper.atDirectPageIndexedX(mockPC, mockX));

        assert.equal(result, 0x42);
    });

    it('Test Direct Page Indexed, Y Addressing Mode', () => {
        mockPC.set(0xC000);
        mockY.set(0xE9);

        mmu.set(0xC000, 0x51);

        mmu.set(0x3A, 0x42);
        const result = mmu.get(helper.atDirectPageIndexedX(mockPC, mockY));

        assert.equal(result, 0x42);
    });

    it('Test Direct Page Indexed Indirect, X Addressing Mode', () => {
        mockPC.set(0xC000);
        mockX.set(0xE9);

        mmu.set(0xC000, 0x51);

        mmu.set(0x3A, 0x04);
        mmu.set(0x3B, 0x31);

        mmu.set(0x3104, 0x81);

        const result = mmu.get(helper.atDirectPageIndexedIndirectX(mockPC, mockX));

        assert.equal(result, 0x81);
    });

    it('Test Direct Page Indirect Indexed, Y Addressing Mode', () => {
        mockPC.set(0xC000);
        mockY.set(0xE9);

        mmu.set(0xC000, 0xA4);
        mmu.set(0xC001, 0xA5);

        mmu.set(0xA4, 0x51);
        mmu.set(0xA5, 0x3F);

        mmu.set(0x403A, 0xBB);

        const result = mmu.get(helper.atDirectPageIndirectIndexedY(mockPC, mockY));

        assert.equal(result, 0xBB);
    });
});
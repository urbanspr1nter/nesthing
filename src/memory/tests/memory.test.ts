import { Memory } from '../memory';
import * as assert from 'assert';

describe('Memory Management Tests', () => {
    const memory = new Memory();

    it('Set and get a value from Direct Page', () => {
        memory.set(0x34, 0x10);
        
        assert.equal(memory.get(0x34), 0x10);
    });
    it('Test mirroring from 0x800-0x07FF', () => {
        memory.set(0x800, 0xAB);

        assert.equal(memory.get(0x800), 0xAB);
        assert.equal(memory.get(0x1000), 0xAB);
        assert.equal(memory.get(0x1800), 0xAB);
        
        memory.set(0x1002, 0xBC);
        
        assert.equal(memory.get(0x802), 0xBC);
        assert.equal(memory.get(0x1002), 0xBC);
        assert.equal(memory.get(0x1802), 0xBC);

        memory.set(0x1833, 0xCC);
        
        assert.equal(memory.get(0x833), 0xCC);
        assert.equal(memory.get(0x1033), 0xCC);
        assert.equal(memory.get(0x1833), 0xCC);
    });
    it('Test PPU mirroring from 0x2000-0x3FFF', () => {
        memory.set(0x2010, 0x5);

        assert.equal(memory.get(0x2000), 0x5);
        assert.equal(memory.get(0x2008), 0x5);
        assert.equal(memory.get(0x2010), 0x5);
        assert.equal(memory.get(0x2018), 0x5);
        assert.equal(memory.get(0x2020), 0x5);

        memory.set(0x2310, 0x22);
        
        assert.equal(memory.get(0x2300), 0x22);
        assert.equal(memory.get(0x2318), 0x22);
    });
});
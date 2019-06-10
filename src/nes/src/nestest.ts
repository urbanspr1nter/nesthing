import { Nes } from './nes';

const nes = new Nes();
// nes.run();

console.log(nes.cpuMemory()[0x02].toString(16));
console.log(nes.cpuMemory()[0x03].toString(16));
console.log(nes.cpuRegisters());
import { Nes } from './nes';
import { EventEmitter } from 'events';

const nes = new Nes(new EventEmitter());
// nes.run();

console.log(nes.cpuMemory()[0x02].toString(16));
console.log(nes.cpuMemory()[0x03].toString(16));
console.log(nes.cpuRegisters());
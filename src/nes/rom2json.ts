import * as fs from 'fs';
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

 const bytes: number[] = [];
 const romContents = fs.readFileSync('../nes/MARIO.nes');
 romContents.forEach(value => {
     bytes.push(value);
 });

 const result = {
     name: 'MARIO.nes',
     raw: bytes
 };

 fs.writeFileSync('../nes/mario.json', JSON.stringify(result));

import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./roms/original/Tetris.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "tetris.nes",
  raw: bytes
};

fs.writeFileSync("./tetris.json", JSON.stringify(result));

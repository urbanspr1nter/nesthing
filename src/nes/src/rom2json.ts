import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./roms/original/SilkWorm.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "sw.nes",
  raw: bytes
};

fs.writeFileSync("./silkworm.json", JSON.stringify(result));

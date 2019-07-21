import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./roms/original/battletoads.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "battletoads.nes",
  raw: bytes
};

fs.writeFileSync("./bt.json", JSON.stringify(result));

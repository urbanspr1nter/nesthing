import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./roms/original/SuperC.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "superc.nes",
  raw: bytes
};

fs.writeFileSync("./superc.json", JSON.stringify(result));

import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./roms/original/FinalFantasy.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "ff.nes",
  raw: bytes
};

fs.writeFileSync("./ff.json", JSON.stringify(result));

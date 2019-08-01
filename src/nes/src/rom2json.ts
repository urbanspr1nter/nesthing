import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./roms/original/Contra.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "contra.nes",
  raw: bytes
};

fs.writeFileSync("./contra.json", JSON.stringify(result));

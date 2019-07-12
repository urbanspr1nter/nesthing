import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./roms/original/Zelda.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "loz.nes",
  raw: bytes
};

fs.writeFileSync("./loz.json", JSON.stringify(result));

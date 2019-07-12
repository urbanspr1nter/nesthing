import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./roms/original/F1Race.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "f1race.nes",
  raw: bytes
};

fs.writeFileSync("./f1race.json", JSON.stringify(result));

import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./roms/original/TeenageMutantHeroTurtles.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "tmnt.nes",
  raw: bytes
};

fs.writeFileSync("./tmnt.json", JSON.stringify(result));

import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./nestest.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "nestest.nes",
  raw: bytes
};

fs.writeFileSync("./nestest.json", JSON.stringify(result));

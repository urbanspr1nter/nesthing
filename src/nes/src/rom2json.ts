import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./dk.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "dk.nes",
  raw: bytes
};

fs.writeFileSync("./donkey.json", JSON.stringify(result));

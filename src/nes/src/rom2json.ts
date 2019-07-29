import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./roms/original/excitebike.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "ebike.nes",
  raw: bytes
};

fs.writeFileSync("./ebike.json", JSON.stringify(result));

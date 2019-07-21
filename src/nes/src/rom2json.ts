import * as fs from "fs";
/**
 * Schema
 * {
 *  name: filename.nes,
 *  raw: [1,2,3,4,5,6]
 * }
 */

const bytes: number[] = [];
const romContents = fs.readFileSync("./roms/original/SMB3.nes");
romContents.forEach(value => {
  bytes.push(value);
});

const result = {
  name: "SMB3.nes",
  raw: bytes
};

fs.writeFileSync("./smb3.json", JSON.stringify(result));

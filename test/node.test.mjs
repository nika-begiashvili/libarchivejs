import { Archive } from "../dist/libarchive-node.mjs";
import fs from "fs";
import { Blob } from "buffer";
import { fileChecksums } from "./checksum-utils";
import { checksum } from "./checksum";

describe("Extract file using nodejs", () => {
  test("Extract 7z file", async () => {
    let buffer = fs.readFileSync("test/files/archives/test.7z");
    let blob = new Blob([buffer]);

    const archive = await Archive.open(blob);

    const filesObj = await archive.extractFiles();

    const checksumObj = await fileChecksums(filesObj);

    expect(checksumObj).toEqual(checksum);
  }, 16000);
});

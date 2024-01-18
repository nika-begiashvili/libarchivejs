import { Archive, ArchiveCompression, ArchiveFormat } from "../dist/libarchive-node.mjs";
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
    archive.close();
  }, 5000);


  test("Create new archive", async () => {
    let buffer = fs.readFileSync("test/files/archives/README.md");
    let blob = new Blob([buffer]);

    const archiveFile = await Archive.write({
      files: [{ 
        file: blob,
        pathname: "README.md",
      }],
      outputFileName: "test.tar.gz",
      compression: ArchiveCompression.GZIP,
      format: ArchiveFormat.USTAR,
      passphrase: null,
    });

    const archive = await Archive.open(archiveFile);
    const filesObj = await archive.extractFiles();
    const checksumObj = await fileChecksums(filesObj);
    expect(checksumObj["README.md"]).toEqual(checksum["README.md"]);

    archive.close();
  }, 5000);

});

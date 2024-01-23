/* eslint-disable no-undef */
import { checksum } from "../checksum.js";
import { navigate, inputFile, response, setup, cleanup } from "../testutils.mjs";

let browser, page;

beforeAll(async () => {
  let tmp = await setup();
  browser = tmp.browser;
  page = tmp.page;
});

describe("Extract TAR files with various compressions", () => {
  test("Extract TAR without compression", async () => {
    await navigate(page);
    await inputFile("archives/tar/test.tar", page);
    const files = await response(page);
    expect(files).toEqual(checksum);
  }, 16000);
  test("Extract TAR BZIP2", async () => {
    await navigate(page);
    await inputFile("archives/tar/test.tar.bz2", page);
    const files = await response(page);
    expect(files).toEqual(checksum);
  }, 16000);
  test("Extract TAR GZIP", async () => {
    await navigate(page);
    await inputFile("archives/tar/test.tar.gz", page);
    const files = await response(page);
    expect(files).toEqual(checksum);
  }, 16000);
  test("Extract TAR LZMA2", async () => {
    await navigate(page);
    await inputFile("archives/tar/test.tar.xz", page);
    const files = await response(page);
    expect(files).toEqual(checksum);
  }, 16000);
});

afterAll(() => {
  cleanup(browser);
});

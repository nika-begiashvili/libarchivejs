/* eslint-disable no-undef */
const { checksum } = require("./checksum.js");
const {
  navigate,
  inputFile,
  response,
  setup,
  cleanup,
} = require("./testutils.js");

let browser, page;

beforeAll(async () => {
  console.log("before setup");
  let tmp = await setup();
  browser = tmp.browser;
  page = tmp.page;
});

describe("extract various compression types", () => {
  test("extract 7z file", async () => {
    await navigate(page);
    await inputFile("archives/test.7z", page);
    const files = await response(page);
    expect(files).toEqual(checksum);
  }, 16000);

  test("extract single file from zip", async () => {
    await navigate(page, "test-single.html");
    await inputFile("archives/test.zip", page);
    const checksums = await response(page);
    expect(checksums[0]).toEqual(checksum[".gitignore"]);
    expect(checksums[1]).toEqual(checksum["README.md"]);
    expect(checksums[2]).toEqual(checksum["addon"]["addon.py"]);
  }, 16000);

  test("extract encrypted zip", async () => {
    await navigate(page, "encryption.html");
    await inputFile("archives/encrypted.zip", page);
    const { files, encrypted } = await response(page);
    expect(encrypted).toEqual(true);
    expect(files).toEqual(checksum);
  }, 16000);

  test("create new tar.gz archive", async () => {
    await navigate(page, "write-archive.html");
    await inputFile("archives/README.md", page);
    const checksums = await response(page);
    expect(checksums["README.md"]).toEqual(checksum["README.md"]);
  }, 16000);
});

afterAll(() => {
  cleanup(browser);
});

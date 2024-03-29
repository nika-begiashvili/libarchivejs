/* eslint-disable no-undef */
import { checksum } from "../checksum.js";
import {
  navigate,
  inputFile,
  response,
  setup,
  cleanup,
} from "../testutils.mjs";

let browser, page;

beforeAll(async () => {
  let tmp = await setup();
  browser = tmp.browser;
  page = tmp.page;
});

describe("Extract RAR files", () => {
  test("Extract RAR v4", async () => {
    await navigate(page);
    await inputFile("archives/rar/test-v4.rar", page);
    const files = await response(page);
    expect(files).toEqual(checksum);
  }, 16000);
  test("Extract RAR v5", async () => {
    await navigate(page);
    await inputFile("archives/rar/test-v5.rar", page);
    const files = await response(page);
    expect(files).toEqual(checksum);
  }, 16000);
});

afterAll(() => {
  cleanup(browser);
});

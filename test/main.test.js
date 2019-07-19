/* eslint-disable no-undef */
const {checksum} = require('./checksum');
const {navigate,inputFile,response,setup,cleanup} = require('./testutils');

let browser,page;

beforeAll(async () => {
    let tmp = await setup();
    browser = tmp.browser;
    page = tmp.page;
});

describe("extract various compression types", () => {
    test("extract zip file", async () => {
        await navigate(page);
        await inputFile('archives/test.zip',page);
        const files = await response(page);
        expect(files).toEqual(checksum);
    }, 16000);
    test("extract 7z file", async () => {
        await navigate(page);
        await inputFile('archives/test.7z',page);
        const files = await response(page);
        expect(files).toEqual(checksum);
    }, 16000);
    test("extract tar file", async () => {
        await navigate(page);
        await inputFile('archives/test.tar',page);
        const files = await response(page);
        expect(files).toEqual(checksum);
    }, 16000);
    test("extract tar.gz file", async () => {
        await navigate(page);
        await inputFile('archives/test.tar.gz',page);
        const files = await response(page);
        expect(files).toEqual(checksum);
    }, 16000);
    test("extract rar v4 file", async () => {
        await navigate(page);
        await inputFile('archives/test.rar',page);
        const files = await response(page);
        expect(files).toEqual(checksum);
    }, 16000);
    test("extract rar v5 file", async () => {
        await navigate(page);
        await inputFile('archives/test-v5.rar',page);
        const files = await response(page);
        expect(files).toEqual(checksum);
    }, 16000);
    test("extract tar.bz2 file", async () => {
        await navigate(page);
        await inputFile('archives/test.tar.bz2',page);
        const files = await response(page);
        expect(files).toEqual(checksum);
    }, 16000);
});

afterAll(() => {
    cleanup(browser);
});
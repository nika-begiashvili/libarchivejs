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
    test("extract 7z file", async () => {
        await navigate(page);
        await inputFile('archives/test.7z',page);
        const files = await response(page);
        expect(files).toEqual(checksum);
    }, 16000);

    test("extract single file from zip", async () => {
        await navigate(page,'test-single.html');
        await inputFile('archives/test.zip',page);
        const file = await response(page);
        expect(file).toEqual(checksum['.gitignore']);
    }, 16000);
});

afterAll(() => {
    cleanup(browser);
});
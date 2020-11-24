/* eslint-disable no-undef */
const {checksum} = require('../../checksum');

const { File } = require('file-api');
const { runTest } = require('../test-bundle.js');

describe("Extract 7Z files with various compressions in node.js", () => {
    test("Extract 7Z with LZMA", async () => {
        const file = new File(`${__dirname}/../../files/archives/7z/lzma.7z`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
    test("Extract 7Z with LZMA2", async () => {
        const file = new File(`${__dirname}/../../files/archives/7z/lzma2.7z`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
    test("Extract 7Z with BZIP2", async () => {
        const file = new File(`${__dirname}/../../files/archives/7z/bzip2.7z`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
});

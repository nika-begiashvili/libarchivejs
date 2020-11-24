/* eslint-disable no-undef */
const {checksum} = require('../../checksum');

const { File } = require('file-api');
const { runTest } = require('../test-bundle.js');

describe("Extract ZIP files with various compressions in node.js", () => {
    test("Extract ZIP deflate", async () => {
        const file = new File(`${__dirname}/../../files/archives/zip/deflate.zip`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
    /* test("Extract ZIP deflate64", async () => { // not support
        const file = new File(`${__dirname}/../../files/archives/zip/deflate64.zip`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000); */
    test("Extract ZIP bzip2", async () => {
        const file = new File(`${__dirname}/../../files/archives/zip/bzip2.zip`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
    test("Extract ZIP lzma", async () => {
        const file = new File(`${__dirname}/../../files/archives/zip/lzma.zip`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
});

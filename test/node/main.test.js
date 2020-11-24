/* eslint-disable no-undef */
const {checksum} = require('../checksum');

const { File } = require('file-api');
const { runTest, runEncryptionTest, runSingleTest } = require('./test-bundle.js');

describe("extract various compression types in node.js", () => {
    test("extract 7z file", async () => {
        const file = new File(`${__dirname}/../files/archives/test.7z`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);

    test("extract single file from zip", async () => {
        const file = new File(`${__dirname}/../files/archives/test.zip`);
        const fileResult = await runSingleTest(file);
        expect(fileResult).toEqual(checksum['.gitignore']);
    }, 16000);
    
    test("extract encrypted zip", async () => {
        const file = new File(`${__dirname}/../files/archives/encrypted.zip`);
        const {files,encrypted} = await runEncryptionTest(file);
        expect(encrypted).toEqual(true);
        expect(files).toEqual(checksum);
    }, 16000);
});

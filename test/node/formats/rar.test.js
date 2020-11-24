/* eslint-disable no-undef */
const {checksum} = require('../../checksum');

const { File } = require('file-api');
const { runTest } = require('../test-bundle.js');

describe("Extract RAR files in node.js", () => {
    test("Extract RAR v4", async () => {
        const file = new File(`${__dirname}/../../files/archives/rar/test-v4.rar`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
    test("Extract RAR v5", async () => {
        const file = new File(`${__dirname}/../../files/archives/rar/test-v5.rar`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
});

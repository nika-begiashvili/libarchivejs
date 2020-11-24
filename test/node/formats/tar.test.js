/* eslint-disable no-undef */
const {checksum} = require('../../checksum');

const { File } = require('file-api');
const { runTest } = require('../test-bundle.js');

describe("Extract TAR files with various compressions in node.js", () => {
    test("Extract TAR without compression", async () => {
        const file = new File(`${__dirname}/../../files/archives/tar/test.tar`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
    test("Extract TAR BZIP2", async () => {
        const file = new File(`${__dirname}/../../files/archives/tar/test.tar.bz2`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
    test("Extract TAR GZIP", async () => {
        const file = new File(`${__dirname}/../../files/archives/tar/test.tar.gz`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
    test("Extract TAR LZMA2", async () => {
        const file = new File(`${__dirname}/../../files/archives/tar/test.tar.xz`);
        const files = await runTest(file);
        expect(files).toEqual(checksum);
    }, 16000);
});

const {checksum} = require('./checksum');
const puppeteer = require('puppeteer');

const StaticServer = require('static-server');
const port = 8787;
const server = new StaticServer({
  rootPath: '.',
  port: port,
  cors: '*',
});

const startServer = () => new Promise((resolve,reject) => {
    server.start( () => {
        console.log('Server listening to', port);
        resolve();
    });
});

let page;
let browser;
const width = 800;
const height = 600;

async function navigate(){
    await page.goto(`http://127.0.0.1:${port}/test/files/index.html`);
}
async function inputFile(file){
    const fileInp = await page.$('#file');
    fileInp.uploadFile('test/files/'+file);
}
async function response(){
    await page.waitForSelector('#done');
    return await page.evaluate(`window.obj`);
}

beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.setViewport({ width, height });
    await startServer();
    page.on('console', msg => {
        for (let i = 0; i < msg.args().length; ++i) console.log(`${i}: ${msg.args()[i]}`);
    });
});

describe("extract various compression types", () => {
    test("extract zip file", async () => {
        await navigate();
        await inputFile('archives/test.zip');
        const files = await response();
        expect(files).toEqual(checksum);
    }, 16000);
    test("extract 7z file", async () => {
        await navigate();
        await inputFile('archives/test.7z');
        const files = await response();
        expect(files).toEqual(checksum);
    }, 16000);
    test("extract tar file", async () => {
        await navigate();
        await inputFile('archives/test.tar');
        const files = await response();
        expect(files).toEqual(checksum);
    }, 16000);
    test("extract tar.gz file", async () => {
        await navigate();
        await inputFile('archives/test.tar.gz');
        const files = await response();
        expect(files).toEqual(checksum);
    }, 16000);
    test("extract rar v4 file", async () => {
        await navigate();
        await inputFile('archives/test.tar.gz');
        const files = await response();
        expect(files).toEqual(checksum);
    }, 16000);
    // bz2 support not available yet
    /*test("extract tar.bz2 file", async () => {
        await navigate();
        await inputFile('archives/test.tar.bz2');
        const files = await response();
        expect(files).toEqual(checksum);
    }, 16000);*/
});

afterAll(() => {
    server.stop();
    browser.close();
});
const {checksum} = require('./checksum');
const puppeteer = require('puppeteer');

const StaticServer = require('static-server');
const port = 8788;
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
    await page.goto(`http://127.0.0.1:${port}/test/files/test-single.html`);
}
async function inputFile(file){
    const fileInp = await page.$('#file');
    fileInp.uploadFile('test/files/'+file);
}
async function response(){
    await page.waitForSelector('#done');
    return {
        filesObj: await page.evaluate(`window.obj`),
        file: await page.evaluate(`window.fileObj`)
    };
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

describe("test file listing", () => {
    test("extract single file from zip", async () => {
        await navigate();
        await inputFile('archives/test.zip');
        const { filesObj, file } = await response();
        expect(filesObj).toEqual(checksum);
        expect(file).toEqual(checksum['.gitignore']);
    }, 16000);
});

afterAll(() => {
    server.stop();
    browser.close();
});
import StaticServer from "static-server";
import puppeteer from "puppeteer";
import isWsl from "is-wsl";

const port = 8787;
const width = 800;
const height = 600;
const server = new StaticServer({
  rootPath: ".",
  port: port,
  cors: "*",
});

const startServer = () =>
  new Promise((resolve) => {
    server.start(() => {
      console.log("Server listening to", port);
      resolve();
    });
  });

export const setup = async () => {
  let browser = isWsl
    ? await puppeteer.launch({
        headless: "new",
        executablePath: "google-chrome",
        args: ["--no-sandbox"],
      })
    : await puppeteer.launch({ headless: "new" });

  let page = await browser.newPage();
  await page.setViewport({ width, height });
  await startServer();
  page.on("console", (msg) => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });
  return { browser, page };
};

export const cleanup = (browser) => {
  server.stop();
  browser.close();
};

export const navigate = async function (page, path = "index.html") {
  await page.goto(`http://127.0.0.1:${port}/test/files/${path}`);
};

export const inputFile = async function (file, page) {
  const fileInp = await page.$("#file");
  fileInp.uploadFile("test/files/" + file);
};

export const response = async function (page) {
  await page.waitForSelector("#done");
  return await page.evaluate(`window.obj`);
};
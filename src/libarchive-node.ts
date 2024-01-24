import { Worker } from "worker_threads";
import { URL } from "url";
import * as Comlink from "comlink";
import nodeEndpoint from "comlink/dist/esm/node-adapter";
import { Archive } from "./libarchive";
export * from "./libarchive";

const __dirname = new URL(".", import.meta.url).pathname;

Archive.init({
  getWorker: () => new Worker(`${__dirname}/worker-bundle-node.mjs`),
  createClient: (worker) => Comlink.wrap(nodeEndpoint(worker)),
});

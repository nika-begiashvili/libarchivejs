import { Worker } from "worker_threads";
import { URL } from "url";
import * as Comlink from "comlink";
import nodeEndpoint from "comlink/dist/esm/node-adapter";
import { Archive } from "./libarchive";
export * from "./libarchive";

// Polyfill for Promise.withResolvers on nodejs
(Promise as any).withResolvers ||
  ((Promise as any).withResolvers = function withResolvers() {
    var a,
      b,
      c = new this(function (resolve: Function, reject: Function) {
        a = resolve;
        b = reject;
      });
    return { resolve: a, reject: b, promise: c };
  });

const __dirname = new URL(".", import.meta.url).pathname;

Archive.init({
  getWorker: () => new Worker(`${__dirname}/worker-bundle-node.mjs`),
  createClient: (worker) => Comlink.wrap(nodeEndpoint(worker)),
});

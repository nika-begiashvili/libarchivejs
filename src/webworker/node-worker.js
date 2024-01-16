import * as Comlink from "comlink/dist/esm/comlink.mjs";
import { LibArchiveWorker } from "./worker";
import { parentPort } from "worker_threads";
import nodeEndpoint from "comlink/dist/esm/node-adapter.mjs";

Comlink.expose(LibArchiveWorker, nodeEndpoint(parentPort));

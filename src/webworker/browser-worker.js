import * as Comlink from "comlink/dist/esm/comlink.mjs";
import { LibArchiveWorker } from "./worker";

Comlink.expose(LibArchiveWorker);

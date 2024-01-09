import { ArchiveReader } from "./archive-reader";
import { getWasmModule } from "./wasm-module";
import * as Comlink from "comlink/dist/esm/comlink.mjs";

let reader = null;

class LibArchiveWorker {

  constructor(readyCallback) {
    LibArchiveWorker.readyCallback = readyCallback;
  }

  open(file, cb) {
    reader.open(file).then(() => cb())
  }

  listFiles() {
    let arr = [];
    for (const entry of reader.entries(true)) {
      arr.push(entry)
    }
    return arr;
  }

  extractFiles() {
    let arr = [];
    for (const entry of reader.entries(false)) {
      arr.push(entry)
    }
    return arr;
  }

  extractSingleFile(target) {
    for (const entry of reader.entries(true, target)) {
      if (entry.fileData) {
        return entry;
      }
    }
  }

  hasEncryptedData() {
    return reader.hasEncryptedData();
  }

  usePassword(passphrase) {
    reader.setPassphrase(passphrase);
  }

  setLocale(locale) {
    reader.setLocale(locale);
  }

  close() {
    reader.close();
  }
}

getWasmModule((wasmModule) => {
  reader = new ArchiveReader(wasmModule);
  LibArchiveWorker?.readyCallback();
});

Comlink.expose(LibArchiveWorker);
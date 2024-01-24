import * as Comlink from "comlink";
import { ArchiveCompression, ArchiveFormat } from "./formats.js";
import { ArchiveReader } from "./archive-reader.js";
export { ArchiveCompression, ArchiveFormat } from "./formats.js";

export type ArchiveOptions = {
  workerUrl?: string | URL;
  getWorker?: Function;
  createClient?: (worker: any) => any;
};

export type ArchiveEntryFile = {
  file: ArchiveEntryFile;
  pathname?: string;
};

export type ArchiveWriteOptions = {
  files: ArchiveEntryFile[];
  outputFileName: string;
  compression: ArchiveCompression;
  format: ArchiveFormat;
  passphrase: string | null;
};

export class Archive {
  private static _options: ArchiveOptions = {};

  /**
   * Initialize libarchivejs
   * @param {Object} options
   */
  static init(options: ArchiveOptions | null = null) {
    Archive._options = options || {};
    return Archive._options;
  }

  static async open(file: File) {
    const worker = Archive.getWorker(Archive._options);
    const client = await Archive.getClient(worker, Archive._options);

    const archiveReader = new ArchiveReader(file, client, worker);
    return await archiveReader.open();
  }

  static async write({
    files,
    outputFileName,
    compression,
    format,
    passphrase = null,
  }: ArchiveWriteOptions) {
    const worker = Archive.getWorker(Archive._options);
    const client = await Archive.getClient(worker, Archive._options);

    const archiveData = await client.writeArchive(
      files,
      compression,
      format,
      passphrase,
    );

    worker.terminate();

    return new File([archiveData], outputFileName, {
      type: "application/octet-stream",
    });
  }

  private static getWorker(options: ArchiveOptions) {
    if (options.getWorker) {
      return options.getWorker();
    } else {
      return new Worker(
        options.workerUrl || new URL("./worker-bundle.js", import.meta.url),
        {
          type: "module",
        },
      );
    }
  }

  private static async getClient(worker: any, options: ArchiveOptions) {
    const Client =
      options.createClient?.(worker) || (Comlink.wrap(worker as any) as any);

    // @ts-ignore - Promise.WithResolvers
    let { promise: clientReady, resolve } = Promise.withResolvers();

    const client = await new Client(
      Comlink.proxy(() => {
        resolve();
      }),
    );

    await clientReady;

    return client;
  }
}

// Polyfill for Promise.withResolvers
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

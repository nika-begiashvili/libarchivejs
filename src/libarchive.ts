import { CompressedFile } from "./compressed-file.js";
import * as Comlink from "comlink";
import {
  cloneContent,
  getObjectPropReference,
  objectToArray,
} from "./utils.js";
import { ArchiveCompression, ArchiveFormat } from "./formats.js";
export { ArchiveCompression, ArchiveFormat } from "./formats.js";

export type ArchiveOptions = {
  workerUrl: string | URL;
};

export type ArchiveEntry = {
  size: number;
  path: string;
  type: string;
  lastModified: number;
  fileData: ArrayBuffer;
  fileName: string;
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
  private static _options: ArchiveOptions;

  /**
   * Initialize libarchivejs
   * @param {Object} options
   */
  static init(options: ArchiveOptions | null = null) {
    Archive._options = {
      workerUrl:
        options?.workerUrl || new URL("./worker-bundle.js", import.meta.url),
      ...options,
    };
    return Archive._options;
  }

  private _worker: Worker | null;
  private _content: any;
  private _processed: number;
  private _file: File | null;
  private _client: any;

  static async write({
    files,
    outputFileName,
    compression,
    format,
    passphrase = null,
  }: ArchiveWriteOptions) {
    const _worker = new Worker(Archive._options.workerUrl, {
      type: "module",
    });

    const Client = Comlink.wrap(_worker as any) as any;
    // @ts-ignore - Promise.WithResolvers
    let { promise: clientReady, resolve } = Promise.withResolvers();

    const _client = await new Client(
      Comlink.proxy(() => {
        resolve();
      }),
    );

    await clientReady;

    const archiveData = await _client.writeArchive(
      files,
      compression,
      format,
      passphrase,
    );

    return new File([archiveData], outputFileName, {
      type: "application/octet-stream",
    });
  }

  /**
   * Creates new archive instance from browser native File object
   * @param {File} file
   * @param {object} options
   * @returns {Archive}
   */
  static open(
    file: File,
    options: ArchiveOptions | null = null,
  ): Promise<Archive> {
    options = options || Archive._options || Archive.init();
    const arch = new Archive(file, options);
    return arch.open();
  }

  /**
   * Create new archive
   * @param {File} file
   * @param {Object} options
   */
  constructor(file: File, options: ArchiveOptions) {
    this._worker = new Worker(options.workerUrl, {
      type: "module",
    });

    this._content = {};
    this._processed = 0;
    this._file = file;
  }

  private async getClient() {
    if (!this._client) {
      const Client = Comlink.wrap(this._worker as any) as any;
      // @ts-ignore - Promise.WithResolvers
      let { promise, resolve } = Promise.withResolvers();
      this._client = await new Client(
        Comlink.proxy(() => {
          resolve();
        }),
      );
      await promise;
    }

    return this._client;
  }

  /**
   * Prepares file for reading
   * @returns {Promise<Archive>} archive instance
   */
  open(): Promise<Archive> {
    return new Promise((resolve, _) => {
      this.getClient().then((client) => {
        client.open(
          this._file,
          Comlink.proxy(() => {
            resolve(this);
          }),
        );
      });
    });
  }

  /**
   * Terminate worker to free up memory
   */
  async close() {
    this._worker?.terminate();
    this._worker = null;
    this._client = null;
    this._file = null;
  }

  /**
   * detect if archive has encrypted data
   * @returns {boolean|null} null if could not be determined
   */
  async hasEncryptedData(): Promise<boolean | null> {
    const client = await this.getClient();
    return await client.hasEncryptedData();
  }

  /**
   * set password to be used when reading archive
   */
  async usePassword(archivePassword: string) {
    const client = await this.getClient();
    await client.usePassword(archivePassword);
  }

  /**
   * Set locale, defaults to en_US.UTF-8
   */
  async setLocale(locale: string) {
    const client = await this.getClient();
    await client.setLocale(locale);
  }

  /**
   * Returns object containing directory structure and file information
   * @returns {Promise<object>}
   */
  async getFilesObject(): Promise<any> {
    if (this._processed > 0) {
      return Promise.resolve().then(() => this._content);
    }
    const client = await this.getClient();
    const files = await client.listFiles();

    files.forEach((entry: ArchiveEntry) => {
      const [target, prop] = getObjectPropReference(this._content, entry.path);
      if (entry.type === "FILE") {
        target[prop] = new CompressedFile(
          entry.fileName,
          entry.size,
          entry.path,
          entry.lastModified,
          this,
        );
      }
    });

    this._processed = 1;
    return cloneContent(this._content);
  }

  getFilesArray(): Promise<any[]> {
    return this.getFilesObject().then((obj) => {
      return objectToArray(obj);
    });
  }

  async extractSingleFile(target: string): Promise<File> {
    // Prevent extraction if worker already terminated
    if (this._worker === null) {
      throw new Error("Archive already closed");
    }

    const client = await this.getClient();
    const fileEntry = await client.extractSingleFile(target);
    return new File([fileEntry.fileData], fileEntry.fileName, {
      type: "application/octet-stream",
      lastModified: fileEntry.lastModified / 1_000_000,
    });
  }

  /**
   * Returns object containing directory structure and extracted File objects
   * @param {Function} extractCallback
   *
   */
  async extractFiles(
    extractCallback: Function | undefined = undefined,
  ): Promise<any> {
    if (this._processed > 1) {
      return Promise.resolve().then(() => this._content);
    }
    const client = await this.getClient();
    const files = await client.extractFiles();

    files.forEach((entry: ArchiveEntry) => {
      const [target, prop] = getObjectPropReference(this._content, entry.path);
      if (entry.type === "FILE") {
        target[prop] = new File([entry.fileData], entry.fileName, {
          type: "application/octet-stream",
        });
        if (extractCallback !== undefined) {
          setTimeout(
            extractCallback.bind(null, {
              file: target[prop],
              path: entry.path,
            }),
          );
        }
      }
    });

    this._processed = 2;
    this._worker?.terminate();
    return cloneContent(this._content);
  }
}

import * as Comlink from "comlink";
import { CompressedFile } from "./compressed-file.js";
import { cloneContent, getObjectPropReference, objectToArray } from "./utils";

export type ArchiveEntry = {
  size: number;
  path: string;
  type: string;
  lastModified: number;
  fileData: ArrayBuffer;
  fileName: string;
};

export class ArchiveReader {
  private file: File | null;
  private client: any;
  private worker: any;

  private _content: any = {};
  private _processed: number = 0;

  constructor(file: File, client: any, worker: any) {
    this.file = file;
    this.client = client;
    this.worker = worker;
  }

  /**
   * Prepares file for reading
   * @returns {Promise<Archive>} archive instance
   */
  open(): Promise<ArchiveReader> {
    this._content = {};
    this._processed = 0;
    return new Promise((resolve, _) => {
      this.client.open(
        this.file,
        Comlink.proxy(() => {
          resolve(this);
        }),
      );
    });
  }

  /**
   * Terminate worker to free up memory
   */
  async close() {
    this.worker?.terminate();
    this.worker = null;
    this.client = null;
    this.file = null;
  }

  /**
   * detect if archive has encrypted data
   * @returns {boolean|null} null if could not be determined
   */
  async hasEncryptedData(): Promise<boolean | null> {
    return await this.client.hasEncryptedData();
  }

  /**
   * set password to be used when reading archive
   */
  async usePassword(archivePassword: string) {
    await this.client.usePassword(archivePassword);
  }

  /**
   * Set locale, defaults to en_US.UTF-8
   */
  async setLocale(locale: string) {
    await this.client.setLocale(locale);
  }

  /**
   * Returns object containing directory structure and file information
   * @returns {Promise<object>}
   */
  async getFilesObject(): Promise<any> {
    if (this._processed > 0) {
      return Promise.resolve().then(() => this._content);
    }
    const files = await this.client.listFiles();

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
    if (this.worker === null) {
      throw new Error("Archive already closed");
    }

    const fileEntry = await this.client.extractSingleFile(target);
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
    const files = await this.client.extractFiles();

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
    this.worker?.terminate();
    return cloneContent(this._content);
  }
}

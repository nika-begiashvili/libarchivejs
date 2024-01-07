import { CompressedFile } from "./compressed-file.js";
import * as Comlink from "comlink/dist/esm/comlink.mjs";

export class Archive {
  /**
   * Initialize libarchivejs
   * @param {Object} options
   */
  static init(options = {}) {
    Archive._options = {
      workerUrl: options.workerUrl || new URL("./worker-bundle.js", import.meta.url),
      ...options,
    };
    return Archive._options;
  }

  /**
   * Creates new archive instance from browser native File object
   * @param {File} file
   * @param {object} options
   * @returns {Archive}
   */
  static open(file, options = null) {
    options = options ||
      Archive._options ||
      Archive.init();
    const arch = new Archive(file, options);
    return arch.open();
  }

  /**
   * Create new archive
   * @param {File} file
   * @param {Object} options
   */
  constructor(file, options) {
    this._worker = new Worker(options.workerUrl, {
      type: "module",
    });

    this._callbacks = [];
    this._content = {};
    this._processed = 0;
    this._file = file;
  }

  async getClient() {
    if (!this._client) {
      const Client = Comlink.wrap(this._worker);
      let { promise, resolve } = Promise.withResolvers();
      this._client = await new Client(Comlink.proxy(() => {
        resolve();
      }));
      await promise;
    }

    return this._client;
  }

  /**
   * Prepares file for reading
   * @returns {Promise<Archive>} archive instance
   */
  open() {
    return new Promise((resolve, _) => {
        this.getClient().then((client) => {
          client.open(this._file, Comlink.proxy(() => {
            resolve(this);
          }));
        });
    });
  }

  /**
   * Terminate worker to free up memory
   */
  async close() {
    this._worker.terminate();
    this._worker = null;
    this._client = null;
    this._file = null;
  }

  /**
   * detect if archive has encrypted data
   * @returns {boolean|null} null if could not be determined
   */
  async hasEncryptedData() {
    const client = await this.getClient();
    return await client.hasEncryptedData();
  }

  /**
   * set password to be used when reading archive
   */
  async usePassword(archivePassword) {
    const client = await this.getClient();
    await client.usePassword(archivePassword);
  }

  /**
   * Returns object containing directory structure and file information
   * @returns {Promise<object>}
   */
  async getFilesObject() {
    if (this._processed > 0) {
      return Promise.resolve().then(() => this._content);
    }
    const client = await this.getClient();
    const files = await client.listFiles();

    files.forEach(
      (entry) => {
        const [target, prop] = this._getProp(this._content, entry.path);
        if (entry.type === "FILE") {
          target[prop] = new CompressedFile(
            entry.fileName,
            entry.size,
            entry.path,
            this,
          );
        }
      },
    );

    this._processed = 1;
    return this._cloneContent(this._content);
  }

  getFilesArray() {
    return this.getFilesObject().then((obj) => {
      return this._objectToArray(obj);
    });
  }

  async extractSingleFile(target) {
    // Prevent extraction if worker already terminated
    if (this._worker === null) {
      throw new Error("Archive already closed");
    }

    const client = await this.getClient();
    const fileEntry = await client.extractSingleFile(target);
    return new File([fileEntry.fileData], fileEntry.fileName, {
      type: "application/octet-stream",
    });;
  }

  /**
   * Returns object containing directory structure and extracted File objects
   * @param {Function} extractCallback
   *
   */
  async extractFiles(extractCallback) {
    if (this._processed > 1) {
      return Promise.resolve().then(() => this._content);
    }
    const client = await this.getClient();
    const files = await client.extractFiles();

    files.forEach( (entry) => {
      const [target, prop] = this._getProp(this._content, entry.path);
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
    this._worker.terminate();
    return this._cloneContent(this._content);
  }

  _cloneContent(obj) {
    if (obj instanceof File || obj instanceof CompressedFile || obj === null)
      return obj;
    const o = {};
    for (const prop of Object.keys(obj)) {
      o[prop] = this._cloneContent(obj[prop]);
    }
    return o;
  }

  _objectToArray(obj, path = "") {
    const files = [];
    for (const key of Object.keys(obj)) {
      if (
        obj[key] instanceof File ||
        obj[key] instanceof CompressedFile ||
        obj[key] === null
      ) {
        files.push({
          file: obj[key] || key,
          path: path,
        });
      } else {
        files.push(...this._objectToArray(obj[key], `${path}${key}/`));
      }
    }
    return files;
  }

  _getProp(obj, path) {
    const parts = path.split("/");
    if (parts[parts.length - 1] === "") parts.pop();
    let cur = obj,
      prev = null;
    for (const part of parts) {
      cur[part] = cur[part] || {};
      prev = cur;
      cur = cur[part];
    }
    return [prev, parts[parts.length - 1]];
  }

}

const TYPE_MAP = {
  32768: "FILE",
  16384: "DIR",
  40960: "SYMBOLIC_LINK",
  49152: "SOCKET",
  8192: "CHARACTER_DEVICE",
  24576: "BLOCK_DEVICE",
  4096: "NAMED_PIPE",
};

export class ArchiveReader {
  /**
   * Archive reader
   * @param {WasmModule} wasmModule emscripten module
   */
  constructor(wasmModule) {
    this._wasmModule = wasmModule;
    this._runCode = wasmModule.runCode;
    this._file = null;
    this._passphrase = null;
    this._locale = "en_US.UTF-8";
  }

  /**
   * Open archive, needs to closed manually
   * @param {File} file
   */
  async open(file) {
    if (this._file !== null) {
      console.warn("Closing previous file");
      this.close();
    }
    const fileData = await this._loadFile(file);
    this._fileLength = fileData.length;
    this._filePtr = fileData.ptr;
  }

  /**
   * Close archive
   */
  close() {
    this._runCode.closeArchive(this._archive);
    this._wasmModule._free(this._filePtr);
    this._file = null;
    this._filePtr = null;
    this._archive = null;
  }

  /**
   * Detect if archive has encrypted data
   * @returns {boolean|null} null if could not be determined
   */
  hasEncryptedData() {
    this._archive = this._runCode.openArchive(
      this._filePtr,
      this._fileLength,
      this._passphrase,
      this._locale,
    );
    this._runCode.getNextEntry(this._archive);
    const status = this._runCode.hasEncryptedEntries(this._archive);
    if (status === 0) {
      return false;
    } else if (status > 0) {
      return true;
    } else {
      return null;
    }
  }

  /**
   * set passphrase to be used with archive
   * @param {string} passphrase
   */
  setPassphrase(passphrase) {
    this._passphrase = passphrase;
  }

  /**
   * Set locale, defaults to: en_US.UTF-8
   * @param {string} locale
   */
  setLocale(locale) {
    this._locale = locale;
  }

  /**
   * Get archive entries
   * @param {boolean} skipExtraction
   * @param {string} except don't skip extraction for this entry
   */
  *entries(skipExtraction = false, except = null) {
    this._archive = this._runCode.openArchive(
      this._filePtr,
      this._fileLength,
      this._passphrase,
      this._locale,
    );
    let entry;
    while (true) {
      entry = this._runCode.getNextEntry(this._archive);
      if (entry === 0) break;

      const entryData = {
        size: this._runCode.getEntrySize(entry),
        path: this._runCode.getEntryName(entry),
        type: TYPE_MAP[this._runCode.getEntryType(entry)],
        lastModified: this._runCode.getEntryLastModified(entry),
        ref: entry,
      };

      if (entryData.type === "FILE") {
        let fileName = entryData.path.split("/");
        entryData.fileName = fileName[fileName.length - 1];
      }

      if (skipExtraction && except !== entryData.path) {
        this._runCode.skipEntry(this._archive);
      } else {
        const ptr = this._runCode.getFileData(this._archive, entryData.size);
        if (ptr < 0) {
          throw new Error(this._runCode.getError(this._archive));
        }
        entryData.fileData = this._wasmModule.HEAPU8.slice(
          ptr,
          ptr + entryData.size,
        );
        this._wasmModule._free(ptr);
      }
      yield entryData;
    }
  }

  async _loadFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const array = new Uint8Array(arrayBuffer);
    const filePtr = this._runCode.malloc(array.length);
    this._wasmModule.HEAPU8.set(array, filePtr);
    return {
      ptr: filePtr,
      length: array.length,
    };
  }
}

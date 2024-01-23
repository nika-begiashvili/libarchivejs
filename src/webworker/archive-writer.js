export class ArchiveWriter {
  /**
   * Archive writer
   * @param {WasmModule} wasmModule emscripten module
   */
  constructor(wasmModule) {
    this._wasmModule = wasmModule;
    this._runCode = wasmModule.runCode;
    this._passphrase = null;
    this._locale = "en_US.UTF-8";
  }

  async write(files, compression, format, passphrase = null) {
    // In some cases archive size might be bigger than the sum of all files due to header size
    let totalSize = files.reduce((acc, { file }) => acc + file.size + 128, 0) + 128;

    const bufferPtr = this._runCode.malloc(totalSize);
    const outputSizePtr = this._runCode.malloc(this._runCode.sizeOfSizeT());

    const newArchive = this._runCode.startArchiveWrite(
      compression,
      format,
      bufferPtr,
      totalSize,
      outputSizePtr,
      passphrase,
    );

    for (const { file, pathname } of files) {
      const fileData = await this._loadFile(file);
      this._runCode.writeArchiveFile(
        newArchive,
        pathname || file.name,
        fileData.length,
        fileData.ptr,
      );
      this._runCode.free(fileData.ptr);
    }

    const closeStatus = this._runCode.closeArchiveWrite(newArchive);
    const freeStatus = this._runCode.freeArchiveWrite(newArchive);

    if (closeStatus !== 0 || freeStatus !== 0) {
      throw new Error(this._runCode.getError(newArchive));
    }

    const outputSize = this.readNumberFromPointer(outputSizePtr);

    return this._wasmModule.HEAPU8.slice(bufferPtr, bufferPtr + outputSize);
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

  readNumberFromPointer(ptr) {
    const ptrSize = this._runCode.sizeOfSizeT();
    const outputSizeBytes = this._wasmModule.HEAPU8.slice(ptr, ptr + ptrSize);

    let output = null;
    if (ptrSize == 4) {
      output = new Uint32Array(outputSizeBytes)[0];
    } else if (ptrSize == 8) {
      output = new BigUint64Array(outputSizeBytes)[0];
    } else throw Error("Unexpected size of size_t: " + ptrSize);

    return output;
  }
}

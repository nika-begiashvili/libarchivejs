/**
 * Represents compressed file before extraction
 */
export class CompressedFile {
  constructor(name, size, path, lastModified, archiveRef) {
    this._name = name;
    this._size = size;
    this._path = path;
    this._lastModified = lastModified;
    this._archiveRef = archiveRef;
  }

  /**
   * file name
   */
  get name() {
    return this._name;
  }
  /**
   * file size
   */
  get size() {
    return this._size;
  }

  /*
    * Last modified epoch seconds
    */
  get lastModified() {
    return this._lastModified;
  }

  /**
   * Extract file from archive
   * @returns {Promise<File>} extracted file
   */
  extract() {
    return this._archiveRef.extractSingleFile(this._path);
  }
}

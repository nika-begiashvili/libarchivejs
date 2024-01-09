import { Archive } from "./libarchive";

/**
 * Represents compressed file before extraction
 */
export class CompressedFile {
  constructor(
    name: string,
    size: number,
    path: string,
    lastModified: number,
    archiveRef: Archive,
  ) {
    this._name = name;
    this._size = size;
    this._path = path;
    this._lastModified = lastModified;
    this._archiveRef = archiveRef;
  }

  private _name: string;
  private _size: number;
  private _path: string;
  private _lastModified: number;
  private _archiveRef: any;

  /**
   * File name
   */
  get name() {
    return this._name;
  }
  /**
   * File size
   */
  get size() {
    return this._size;
  }

  /*
   * Last modified nano seconds
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

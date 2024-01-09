import { Archive } from "./libarchive";
/**
 * Represents compressed file before extraction
 */
export declare class CompressedFile {
    constructor(name: string, size: number, path: string, lastModified: number, archiveRef: Archive);
    private _name;
    private _size;
    private _path;
    private _lastModified;
    private _archiveRef;
    /**
     * File name
     */
    get name(): string;
    /**
     * File size
     */
    get size(): number;
    get lastModified(): number;
    /**
     * Extract file from archive
     * @returns {Promise<File>} extracted file
     */
    extract(): any;
}

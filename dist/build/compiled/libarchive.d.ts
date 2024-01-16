import { ArchiveCompression, ArchiveFormat } from "./formats.js";
export { ArchiveCompression, ArchiveFormat } from "./formats.js";
export type ArchiveOptions = {
    workerUrl?: string | URL;
    worker?: any;
    comlinkWrapper?: any;
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
export declare class Archive {
    private static _options;
    /**
     * Initialize libarchivejs
     * @param {Object} options
     */
    static init(options?: ArchiveOptions | null): ArchiveOptions;
    private _worker;
    private _content;
    private _processed;
    private _file;
    private _client;
    static getWorker(options: ArchiveOptions): any;
    static write({ files, outputFileName, compression, format, passphrase, }: ArchiveWriteOptions): Promise<File>;
    /**
     * Creates new archive instance from browser native File object
     * @param {File} file
     * @param {object} options
     * @returns {Archive}
     */
    static open(file: File, options?: ArchiveOptions | null): Promise<Archive>;
    /**
     * Create new archive
     * @param {File} file
     * @param {Object} options
     */
    constructor(file: File, options: ArchiveOptions);
    private getClient;
    /**
     * Prepares file for reading
     * @returns {Promise<Archive>} archive instance
     */
    open(): Promise<Archive>;
    /**
     * Terminate worker to free up memory
     */
    close(): Promise<void>;
    /**
     * detect if archive has encrypted data
     * @returns {boolean|null} null if could not be determined
     */
    hasEncryptedData(): Promise<boolean | null>;
    /**
     * set password to be used when reading archive
     */
    usePassword(archivePassword: string): Promise<void>;
    /**
     * Set locale, defaults to en_US.UTF-8
     */
    setLocale(locale: string): Promise<void>;
    /**
     * Returns object containing directory structure and file information
     * @returns {Promise<object>}
     */
    getFilesObject(): Promise<any>;
    getFilesArray(): Promise<any[]>;
    extractSingleFile(target: string): Promise<File>;
    /**
     * Returns object containing directory structure and extracted File objects
     * @param {Function} extractCallback
     *
     */
    extractFiles(extractCallback?: Function | undefined): Promise<any>;
}

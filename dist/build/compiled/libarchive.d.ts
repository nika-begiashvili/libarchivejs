type ArchiveOptions = {
    workerUrl: string | URL;
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
    /**
     * Creates new archive instance from browser native File object
     * @param {File} file
     * @param {object} options
     * @returns {Archive}
     */
    static open(file: File, options?: ArchiveOptions | null): Promise<unknown>;
    /**
     * Create new archive
     * @param {File} file
     * @param {Object} options
     */
    constructor(file: File, options: ArchiveOptions);
    getClient(): Promise<any>;
    /**
     * Prepares file for reading
     * @returns {Promise<Archive>} archive instance
     */
    open(): Promise<unknown>;
    /**
     * Terminate worker to free up memory
     */
    close(): Promise<void>;
    /**
     * detect if archive has encrypted data
     * @returns {boolean|null} null if could not be determined
     */
    hasEncryptedData(): Promise<any>;
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
    _cloneContent(obj: any): any;
    _objectToArray(obj: any, path?: string): any[];
    _getProp(obj: any, path: string): any[];
}
export {};

/**
 * Represents compressed file before extraction
 */
class CompressedFile {
    constructor(name, size, path, lastModified, archiveRef) {
        this._name = name;
        this._size = size;
        this._path = path;
        this._lastModified = lastModified;
        this._archiveRef = archiveRef;
    }
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

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const proxyMarker = Symbol("Comlink.proxy");
const createEndpoint = Symbol("Comlink.endpoint");
const releaseProxy = Symbol("Comlink.releaseProxy");
const finalizer = Symbol("Comlink.finalizer");
const throwMarker = Symbol("Comlink.thrown");
const isObject = (val) => (typeof val === "object" && val !== null) || typeof val === "function";
/**
 * Internal transfer handle to handle objects marked to proxy.
 */
const proxyTransferHandler = {
    canHandle: (val) => isObject(val) && val[proxyMarker],
    serialize(obj) {
        const { port1, port2 } = new MessageChannel();
        expose(obj, port1);
        return [port2, [port2]];
    },
    deserialize(port) {
        port.start();
        return wrap(port);
    },
};
/**
 * Internal transfer handler to handle thrown exceptions.
 */
const throwTransferHandler = {
    canHandle: (value) => isObject(value) && throwMarker in value,
    serialize({ value }) {
        let serialized;
        if (value instanceof Error) {
            serialized = {
                isError: true,
                value: {
                    message: value.message,
                    name: value.name,
                    stack: value.stack,
                },
            };
        }
        else {
            serialized = { isError: false, value };
        }
        return [serialized, []];
    },
    deserialize(serialized) {
        if (serialized.isError) {
            throw Object.assign(new Error(serialized.value.message), serialized.value);
        }
        throw serialized.value;
    },
};
/**
 * Allows customizing the serialization of certain values.
 */
const transferHandlers = new Map([
    ["proxy", proxyTransferHandler],
    ["throw", throwTransferHandler],
]);
function isAllowedOrigin(allowedOrigins, origin) {
    for (const allowedOrigin of allowedOrigins) {
        if (origin === allowedOrigin || allowedOrigin === "*") {
            return true;
        }
        if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
            return true;
        }
    }
    return false;
}
function expose(obj, ep = globalThis, allowedOrigins = ["*"]) {
    ep.addEventListener("message", function callback(ev) {
        if (!ev || !ev.data) {
            return;
        }
        if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
            console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);
            return;
        }
        const { id, type, path } = Object.assign({ path: [] }, ev.data);
        const argumentList = (ev.data.argumentList || []).map(fromWireValue);
        let returnValue;
        try {
            const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], obj);
            const rawValue = path.reduce((obj, prop) => obj[prop], obj);
            switch (type) {
                case "GET" /* MessageType.GET */:
                    {
                        returnValue = rawValue;
                    }
                    break;
                case "SET" /* MessageType.SET */:
                    {
                        parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
                        returnValue = true;
                    }
                    break;
                case "APPLY" /* MessageType.APPLY */:
                    {
                        returnValue = rawValue.apply(parent, argumentList);
                    }
                    break;
                case "CONSTRUCT" /* MessageType.CONSTRUCT */:
                    {
                        const value = new rawValue(...argumentList);
                        returnValue = proxy(value);
                    }
                    break;
                case "ENDPOINT" /* MessageType.ENDPOINT */:
                    {
                        const { port1, port2 } = new MessageChannel();
                        expose(obj, port2);
                        returnValue = transfer(port1, [port1]);
                    }
                    break;
                case "RELEASE" /* MessageType.RELEASE */:
                    {
                        returnValue = undefined;
                    }
                    break;
                default:
                    return;
            }
        }
        catch (value) {
            returnValue = { value, [throwMarker]: 0 };
        }
        Promise.resolve(returnValue)
            .catch((value) => {
            return { value, [throwMarker]: 0 };
        })
            .then((returnValue) => {
            const [wireValue, transferables] = toWireValue(returnValue);
            ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
            if (type === "RELEASE" /* MessageType.RELEASE */) {
                // detach and deactive after sending release response above.
                ep.removeEventListener("message", callback);
                closeEndPoint(ep);
                if (finalizer in obj && typeof obj[finalizer] === "function") {
                    obj[finalizer]();
                }
            }
        })
            .catch((error) => {
            // Send Serialization Error To Caller
            const [wireValue, transferables] = toWireValue({
                value: new TypeError("Unserializable return value"),
                [throwMarker]: 0,
            });
            ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
        });
    });
    if (ep.start) {
        ep.start();
    }
}
function isMessagePort(endpoint) {
    return endpoint.constructor.name === "MessagePort";
}
function closeEndPoint(endpoint) {
    if (isMessagePort(endpoint))
        endpoint.close();
}
function wrap(ep, target) {
    return createProxy(ep, [], target);
}
function throwIfProxyReleased(isReleased) {
    if (isReleased) {
        throw new Error("Proxy has been released and is not useable");
    }
}
function releaseEndpoint(ep) {
    return requestResponseMessage(ep, {
        type: "RELEASE" /* MessageType.RELEASE */,
    }).then(() => {
        closeEndPoint(ep);
    });
}
const proxyCounter = new WeakMap();
const proxyFinalizers = "FinalizationRegistry" in globalThis &&
    new FinalizationRegistry((ep) => {
        const newCount = (proxyCounter.get(ep) || 0) - 1;
        proxyCounter.set(ep, newCount);
        if (newCount === 0) {
            releaseEndpoint(ep);
        }
    });
function registerProxy(proxy, ep) {
    const newCount = (proxyCounter.get(ep) || 0) + 1;
    proxyCounter.set(ep, newCount);
    if (proxyFinalizers) {
        proxyFinalizers.register(proxy, ep, proxy);
    }
}
function unregisterProxy(proxy) {
    if (proxyFinalizers) {
        proxyFinalizers.unregister(proxy);
    }
}
function createProxy(ep, path = [], target = function () { }) {
    let isProxyReleased = false;
    const proxy = new Proxy(target, {
        get(_target, prop) {
            throwIfProxyReleased(isProxyReleased);
            if (prop === releaseProxy) {
                return () => {
                    unregisterProxy(proxy);
                    releaseEndpoint(ep);
                    isProxyReleased = true;
                };
            }
            if (prop === "then") {
                if (path.length === 0) {
                    return { then: () => proxy };
                }
                const r = requestResponseMessage(ep, {
                    type: "GET" /* MessageType.GET */,
                    path: path.map((p) => p.toString()),
                }).then(fromWireValue);
                return r.then.bind(r);
            }
            return createProxy(ep, [...path, prop]);
        },
        set(_target, prop, rawValue) {
            throwIfProxyReleased(isProxyReleased);
            // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
            // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
            const [value, transferables] = toWireValue(rawValue);
            return requestResponseMessage(ep, {
                type: "SET" /* MessageType.SET */,
                path: [...path, prop].map((p) => p.toString()),
                value,
            }, transferables).then(fromWireValue);
        },
        apply(_target, _thisArg, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const last = path[path.length - 1];
            if (last === createEndpoint) {
                return requestResponseMessage(ep, {
                    type: "ENDPOINT" /* MessageType.ENDPOINT */,
                }).then(fromWireValue);
            }
            // We just pretend that `bind()` didn’t happen.
            if (last === "bind") {
                return createProxy(ep, path.slice(0, -1));
            }
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
                type: "APPLY" /* MessageType.APPLY */,
                path: path.map((p) => p.toString()),
                argumentList,
            }, transferables).then(fromWireValue);
        },
        construct(_target, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, {
                type: "CONSTRUCT" /* MessageType.CONSTRUCT */,
                path: path.map((p) => p.toString()),
                argumentList,
            }, transferables).then(fromWireValue);
        },
    });
    registerProxy(proxy, ep);
    return proxy;
}
function myFlat(arr) {
    return Array.prototype.concat.apply([], arr);
}
function processArguments(argumentList) {
    const processed = argumentList.map(toWireValue);
    return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
}
const transferCache = new WeakMap();
function transfer(obj, transfers) {
    transferCache.set(obj, transfers);
    return obj;
}
function proxy(obj) {
    return Object.assign(obj, { [proxyMarker]: true });
}
function toWireValue(value) {
    for (const [name, handler] of transferHandlers) {
        if (handler.canHandle(value)) {
            const [serializedValue, transferables] = handler.serialize(value);
            return [
                {
                    type: "HANDLER" /* WireValueType.HANDLER */,
                    name,
                    value: serializedValue,
                },
                transferables,
            ];
        }
    }
    return [
        {
            type: "RAW" /* WireValueType.RAW */,
            value,
        },
        transferCache.get(value) || [],
    ];
}
function fromWireValue(value) {
    switch (value.type) {
        case "HANDLER" /* WireValueType.HANDLER */:
            return transferHandlers.get(value.name).deserialize(value.value);
        case "RAW" /* WireValueType.RAW */:
            return value.value;
    }
}
function requestResponseMessage(ep, msg, transfers) {
    return new Promise((resolve) => {
        const id = generateUUID();
        ep.addEventListener("message", function l(ev) {
            if (!ev.data || !ev.data.id || ev.data.id !== id) {
                return;
            }
            ep.removeEventListener("message", l);
            resolve(ev.data);
        });
        if (ep.start) {
            ep.start();
        }
        ep.postMessage(Object.assign({ id }, msg), transfers);
    });
}
function generateUUID() {
    return new Array(4)
        .fill(0)
        .map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
        .join("-");
}

function cloneContent(obj) {
    if (obj instanceof File || obj instanceof CompressedFile || obj === null)
        return obj;
    const o = {};
    for (const prop of Object.keys(obj)) {
        o[prop] = cloneContent(obj[prop]);
    }
    return o;
}
function objectToArray(obj, path = "") {
    const files = [];
    for (const key of Object.keys(obj)) {
        if (obj[key] instanceof File ||
            obj[key] instanceof CompressedFile ||
            obj[key] === null) {
            files.push({
                file: obj[key] || key,
                path: path,
            });
        }
        else {
            files.push(...objectToArray(obj[key], `${path}${key}/`));
        }
    }
    return files;
}
function getObjectPropReference(obj, path) {
    const parts = path.split("/");
    if (parts[parts.length - 1] === "")
        parts.pop();
    let cur = obj, prev = null;
    for (const part of parts) {
        cur[part] = cur[part] || {};
        prev = cur;
        cur = cur[part];
    }
    return [prev, parts[parts.length - 1]];
}

var ArchiveFormat;
(function (ArchiveFormat) {
    ArchiveFormat["SEVEN_ZIP"] = "7zip";
    ArchiveFormat["AR"] = "ar";
    ArchiveFormat["ARBSD"] = "arbsd";
    ArchiveFormat["ARGNU"] = "argnu";
    ArchiveFormat["ARSVR4"] = "arsvr4";
    ArchiveFormat["BIN"] = "bin";
    ArchiveFormat["BSDTAR"] = "bsdtar";
    ArchiveFormat["CD9660"] = "cd9660";
    ArchiveFormat["CPIO"] = "cpio";
    ArchiveFormat["GNUTAR"] = "gnutar";
    ArchiveFormat["ISO"] = "iso";
    ArchiveFormat["ISO9660"] = "iso9660";
    ArchiveFormat["MTREE"] = "mtree";
    ArchiveFormat["MTREE_CLASSIC"] = "mtree-classic";
    ArchiveFormat["NEWC"] = "newc";
    ArchiveFormat["ODC"] = "odc";
    ArchiveFormat["OLDTAR"] = "oldtar";
    ArchiveFormat["PAX"] = "pax";
    ArchiveFormat["PAXR"] = "paxr";
    ArchiveFormat["POSIX"] = "posix";
    ArchiveFormat["PWB"] = "pwb";
    ArchiveFormat["RAW"] = "raw";
    ArchiveFormat["RPAX"] = "rpax";
    ArchiveFormat["SHAR"] = "shar";
    ArchiveFormat["SHARDUMP"] = "shardump";
    ArchiveFormat["USTAR"] = "ustar";
    ArchiveFormat["V7TAR"] = "v7tar";
    ArchiveFormat["V7"] = "v7";
    ArchiveFormat["WARC"] = "warc";
    ArchiveFormat["XAR"] = "xar";
    ArchiveFormat["ZIP"] = "zip";
})(ArchiveFormat || (ArchiveFormat = {}));
var ArchiveCompression;
(function (ArchiveCompression) {
    ArchiveCompression["B64ENCODE"] = "b64encode";
    ArchiveCompression["BZIP2"] = "bzip2";
    ArchiveCompression["COMPRESS"] = "compress";
    ArchiveCompression["GRZIP"] = "grzip";
    ArchiveCompression["GZIP"] = "gzip";
    ArchiveCompression["LRZIP"] = "lrzip";
    ArchiveCompression["LZ4"] = "lz4";
    ArchiveCompression["LZIP"] = "lzip";
    ArchiveCompression["LZMA"] = "lzma";
    ArchiveCompression["LZOP"] = "lzop";
    ArchiveCompression["UUENCODE"] = "uuencode";
    ArchiveCompression["XZ"] = "xz";
    ArchiveCompression["ZSTD"] = "zstd";
    ArchiveCompression["NONE"] = "none";
})(ArchiveCompression || (ArchiveCompression = {}));

class Archive {
    /**
     * Initialize libarchivejs
     * @param {Object} options
     */
    static init(options = null) {
        Archive._options = options || {};
        return Archive._options;
    }
    static getWorker(options) {
        if (options.getWorker) {
            return options.getWorker();
        }
        else {
            return new Worker((options === null || options === void 0 ? void 0 : options.workerUrl) || new URL("./worker-bundle.js", import.meta.url), {
                type: "module",
            });
        }
    }
    static async write({ files, outputFileName, compression, format, passphrase = null, }) {
        var _a, _b;
        const _worker = Archive.getWorker(Archive._options);
        const Client = ((_b = (_a = Archive._options).createClient) === null || _b === void 0 ? void 0 : _b.call(_a, _worker)) || wrap(_worker);
        // @ts-ignore - Promise.WithResolvers
        let { promise: clientReady, resolve } = Promise.withResolvers();
        const _client = await new Client(proxy(() => {
            resolve();
        }));
        await clientReady;
        const archiveData = await _client.writeArchive(files, compression, format, passphrase);
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
    static open(file, options = null) {
        options = options || Archive._options || Archive.init();
        const arch = new Archive(file, options);
        return arch.open();
    }
    /**
     * Create new archive
     * @param {File} file
     * @param {Object} options
     */
    constructor(file, options) {
        this._worker = Archive.getWorker(options);
        this._content = {};
        this._processed = 0;
        this._file = file;
    }
    async getClient() {
        var _a, _b;
        if (!this._client) {
            const Client = ((_b = (_a = Archive._options).createClient) === null || _b === void 0 ? void 0 : _b.call(_a, this._worker)) ||
                wrap(this._worker);
            // @ts-ignore - Promise.WithResolvers
            let { promise, resolve } = Promise.withResolvers();
            this._client = await new Client(proxy(() => {
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
                client.open(this._file, proxy(() => {
                    resolve(this);
                }));
            });
        });
    }
    /**
     * Terminate worker to free up memory
     */
    async close() {
        var _a;
        (_a = this._worker) === null || _a === void 0 ? void 0 : _a.terminate();
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
     * Set locale, defaults to en_US.UTF-8
     */
    async setLocale(locale) {
        const client = await this.getClient();
        await client.setLocale(locale);
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
        files.forEach((entry) => {
            const [target, prop] = getObjectPropReference(this._content, entry.path);
            if (entry.type === "FILE") {
                target[prop] = new CompressedFile(entry.fileName, entry.size, entry.path, entry.lastModified, this);
            }
        });
        this._processed = 1;
        return cloneContent(this._content);
    }
    getFilesArray() {
        return this.getFilesObject().then((obj) => {
            return objectToArray(obj);
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
            lastModified: fileEntry.lastModified / 1000000,
        });
    }
    /**
     * Returns object containing directory structure and extracted File objects
     * @param {Function} extractCallback
     *
     */
    async extractFiles(extractCallback = undefined) {
        var _a;
        if (this._processed > 1) {
            return Promise.resolve().then(() => this._content);
        }
        const client = await this.getClient();
        const files = await client.extractFiles();
        files.forEach((entry) => {
            const [target, prop] = getObjectPropReference(this._content, entry.path);
            if (entry.type === "FILE") {
                target[prop] = new File([entry.fileData], entry.fileName, {
                    type: "application/octet-stream",
                });
                if (extractCallback !== undefined) {
                    setTimeout(extractCallback.bind(null, {
                        file: target[prop],
                        path: entry.path,
                    }));
                }
            }
        });
        this._processed = 2;
        (_a = this._worker) === null || _a === void 0 ? void 0 : _a.terminate();
        return cloneContent(this._content);
    }
}

export { Archive, ArchiveCompression, ArchiveFormat };

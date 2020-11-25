'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fileApi = require('file-api');
var Worker = _interopDefault(require('web-worker'));
var webcrypto = require('@peculiar/webcrypto');

/**
 * Represents compressed file before extraction
 */
class CompressedFile{

    constructor(name,size,path,archiveRef){
        this._name = name;
        this._size = size;
        this._path = path;
        this._archiveRef = archiveRef;
    }

    /**
     * file name
     */
    get name(){
        return this._name;
    }
    /**
     * file size
     */
    get size(){
        return this._size;
    }

    /**
     * Extract file from archive
     * @returns {Promise<File>} extracted file
     */
    extract(){
        return this._archiveRef.extractSingleFile(this._path);
    }

}

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(wasmRoot|crypto)" }] */
    // Referenced in worker-bundle.js, not in main bundle.

// node.js jest shim definitions
//
// __dirname is relative to test/node/, as it is evaluated from bundle
// on runtime.

let wasmRoot = `${__dirname}/../../dist-node/wasm-gen`;
// web-worker package requires a valid URL
let workerPath = `file:///${__dirname}/../../dist-node/worker-bundle.js`;
let crypto = new webcrypto.Crypto();

class Archive{

    /**
     * Initialize libarchivejs
     * @param {Object} options 
     */
    static init(options = {}){
        Archive._options = {
            workerUrl: workerPath,
            ...options
        };
        return Archive._options;
    }

    /**
     * Creates new archive instance from browser native File object
     * @param {File} file
     * @param {object} options
     * @returns {Archive}
     */
    static open(file, options = null){
        options =   options || 
                    Archive._options || 
                    Archive.init() && console.warn('Automatically initializing using options: ', Archive._options);
        const arch = new Archive(file,options);
        return arch.open();
    }

    /**
     * Create new archive
     * @param {File} file 
     * @param {Object} options 
     */
    constructor(file,options){
        this._worker = new Worker(options.workerUrl);
        this._worker.addEventListener('message', this._workerMsg.bind(this));
        this._callbacks = [];
        this._content = {};
        this._processed = 0;
        this._file = file;
    }

    /**
     * Prepares file for reading
     * @returns {Promise<Archive>} archive instance
     */
    async open(){
        await this._postMessage({type: 'HELLO'},(resolve,reject,msg) => {
            if( msg.type === 'READY' ){
                resolve();
            }
        });
        return await this._postMessage({type: 'OPEN', file: this._file}, (resolve,reject,msg) => {
            if(msg.type === 'OPENED'){
                resolve(this);
            }
        });
    }
    
    /**
     * Terminate worker to free up memory
     */
    close() {
        this._worker.terminate();
        this._worker = null;
    }

    /**
     * detect if archive has encrypted data
     * @returns {boolean|null} null if could not be determined
     */
    hasEncryptedData(){
        return this._postMessage({type: 'CHECK_ENCRYPTION'}, 
            (resolve,reject,msg) => {
                if( msg.type === 'ENCRYPTION_STATUS' ){
                    resolve(msg.status);
                }
            }
        );
    }

    /**
     * set password to be used when reading archive
     */
    usePassword(archivePassword){
        return this._postMessage({type: 'SET_PASSPHRASE', passphrase: archivePassword},
            (resolve,reject,msg) => {
                if( msg.type === 'PASSPHRASE_STATUS' ){
                    resolve(msg.status);
                }
            }
        );
    }

    /**
     * Returns object containing directory structure and file information 
     * @returns {Promise<object>}
     */
    getFilesObject(){
        if( this._processed > 0 ){
            return Promise.resolve().then( () => this._content );
        }
        return this._postMessage({type: 'LIST_FILES'}, (resolve,reject,msg) => {
            if( msg.type === 'ENTRY' ){
                const entry = msg.entry;
                const [ target, prop ] = this._getProp(this._content,entry.path);
                if( entry.type === 'FILE' ){
                    target[prop] = new CompressedFile(entry.fileName,entry.size,entry.path,this);                    
                }
                return true;
            }else if( msg.type === 'END' ){
                this._processed = 1;
                resolve(this._cloneContent(this._content));
            }
        });
    }

    getFilesArray(){
        return this.getFilesObject().then( (obj) => {
            return this._objectToArray(obj);
        });
    }

    extractSingleFile(target){
        // Prevent extraction if worker already terminated
        if( this._worker === null ){
            throw new Error("Archive already closed");
        }

        return this._postMessage({type: 'EXTRACT_SINGLE_FILE', target: target}, 
            (resolve,reject,msg) => {
                if( msg.type === 'FILE' ){
                    const file = new fileApi.File([msg.entry.fileData], msg.entry.fileName, {
                        type: 'application/octet-stream'
                    });
                    resolve(file);
                }
            }
        );
    }

    /**
     * Returns object containing directory structure and extracted File objects 
     * @param {Function} extractCallback
     * 
     */
    extractFiles(extractCallback){
        if( this._processed > 1 ){
            return Promise.resolve().then( () => this._content );
        }
        return this._postMessage({type: 'EXTRACT_FILES'}, (resolve,reject,msg) => {
            if( msg.type === 'ENTRY' ){
                const [ target, prop ] = this._getProp(this._content,msg.entry.path);
                if( msg.entry.type === 'FILE' ){
                    target[prop] = new fileApi.File([msg.entry.fileData], msg.entry.fileName, {
                        type: 'application/octet-stream'
                    });
                    if (extractCallback !== undefined) {
                        setTimeout(extractCallback.bind(null,{
                            file: target[prop],
                            path: msg.entry.path,
                        }));
                    }
                }
                return true;
            }else if( msg.type === 'END' ){
                this._processed = 2;
                this._worker.terminate();
                resolve(this._cloneContent(this._content));
            }
        });
    }

    _cloneContent(obj){
        if( obj instanceof fileApi.File || obj instanceof CompressedFile || obj === null ) return obj;
        const o = {};
        for( const prop of Object.keys(obj) ){
            o[prop] = this._cloneContent(obj[prop]);
        }
        return o;
    }

    _objectToArray(obj,path = ''){
        const files = [];
        for( const key of Object.keys(obj) ){
            if( obj[key] instanceof fileApi.File || obj[key] instanceof CompressedFile || obj[key] === null ){
                files.push({
                    file: obj[key] || key,
                    path: path
                });
            }else {
                files.push( ...this._objectToArray(obj[key],`${path}${key}/`) );
            }
        }
        return files;
    }

    _getProp(obj,path){
        const parts = path.split('/');
        if( parts[parts.length -1] === '' ) parts.pop();
        let cur = obj, prev = null;
        for( const part of parts ){
            cur[part] = cur[part] || {};
            prev = cur;
            cur = cur[part];
        }
        return [ prev, parts[parts.length-1] ];
    }

    _postMessage(msg,callback){
        this._worker.postMessage(msg);
        return new Promise((resolve,reject) => {
            this._callbacks.push( this._msgHandler.bind(this,callback,resolve,reject) );
        });
    }

    _msgHandler(callback,resolve,reject,msg){
        if( msg.type === 'BUSY' ){
            reject('worker is busy');
        }else if( msg.type === 'ERROR' ){
            reject(msg.error);
        }else {
            return callback(resolve,reject,msg);
        }
    }

    _workerMsg({data: msg}){
        const callback = this._callbacks[this._callbacks.length -1];
        const next = callback(msg);
        if( !next ){
            this._callbacks.pop();
        }
    }

}

if (typeof window !== 'undefined') {
    // browser environment
    window.Archive = Archive;

    Archive.init({
        workerUrl: '../../dist/worker-bundle.js'
    });
} else {
    Archive.init();
}

function hex(buffer) {
    const hexCodes = [];
    const view = new DataView(buffer);
    for (let i = 0; i < view.byteLength; i += 4) {
        const value = view.getUint32(i);
        const stringValue = value.toString(16);
        const padding = '00000000';
        const paddedValue = (padding + stringValue).slice(-padding.length);
        hexCodes.push(paddedValue);
    }
    return hexCodes.join("");
}

function getChecksum(file){
    return new Promise((resolve,reject) => {
        try{
            const reader = new fileApi.FileReader();
            reader.onload = function() {
                crypto.subtle.digest("SHA-256", reader.result).then(function (hash) {
                    resolve(hex(hash));
                });
            };
            reader.readAsArrayBuffer(file);
        }catch(err){
            reject(err);
        }
    });
}

async function fileChecksums(obj){
    for( const [key,val] of Object.entries(obj) ){
        obj[key] = val instanceof fileApi.File ? 
            await getChecksum(val) : await fileChecksums(val);
    }
    return obj;
}

async function runTest(file) {
    let obj = null;

    const archive = await Archive.open(file);
    //console.log( await archive.getFilesObject() );
    //console.log( await archive.getFilesArray() );
    obj = await archive.extractFiles();
    //console.log( await archive.getFilesObject() );
    //console.log( await archive.getFilesArray() );
    obj = await fileChecksums(obj);

    return obj;
}

async function runEncryptionTest(file) {
    let obj = null, encEntries = false;

    const archive = await Archive.open(file);
    encEntries = await archive.hasEncryptedData();
    await archive.usePassword("nika");
    obj = await archive.extractFiles();
    obj = await fileChecksums(obj);

    return {files: obj, encrypted: encEntries};
}

async function runSingleTest(file) {
    let fileObj;

    const archive = await Archive.open(file);
    const files =  await archive.getFilesArray();
    fileObj = await files[0].file.extract();

    return getChecksum(fileObj);
}

exports.runEncryptionTest = runEncryptionTest;
exports.runSingleTest = runSingleTest;
exports.runTest = runTest;
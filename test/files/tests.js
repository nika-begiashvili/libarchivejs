import { Archive } from '../../src/libarchive.js';

import { File, FileReader, crypto } from '../../src/shim/browser.js';

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
        const value = view.getUint32(i)
        const stringValue = value.toString(16)
        const padding = '00000000'
        const paddedValue = (padding + stringValue).slice(-padding.length)
        hexCodes.push(paddedValue);
    }
    return hexCodes.join("");
}

function getChecksum(file){
    return new Promise((resolve,reject) => {
        try{
            const reader = new FileReader();
            reader.onload = function() {
                crypto.subtle.digest("SHA-256", reader.result).then(function (hash) {
                    resolve(hex(hash));
                });
            }
            reader.readAsArrayBuffer(file);
        }catch(err){
            reject(err);
        }
    });
}

async function fileChecksums(obj){
    for( const [key,val] of Object.entries(obj) ){
        obj[key] = val instanceof File ? 
            await getChecksum(val) : await fileChecksums(val);
    }
    return obj;
}

export async function runTest(file) {
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

export async function runEncryptionTest(file) {
    let obj = null, encEntries = false;

    const archive = await Archive.open(file);
    encEntries = await archive.hasEncryptedData();
    await archive.usePassword("nika");
    obj = await archive.extractFiles();
    obj = await fileChecksums(obj);

    return {files: obj, encrypted: encEntries};
}

export async function runSingleTest(file) {
    let fileObj;

    const archive = await Archive.open(file);
    const files =  await archive.getFilesArray();
    fileObj = await files[0].file.extract();

    return getChecksum(fileObj);
}

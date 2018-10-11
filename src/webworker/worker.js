importScripts('archive-reader.js');
importScripts('wasm-module.js');
var Module = new WasmModule();
importScripts('wasm-gen/libarchive.js');
const reader = new ArchiveReader(Module);

onmessage = (e) => {
    reader.open(e.data).then( () => {
        for( entry of reader.entries() ){
            postMessage(entry);
        }
    }).catch( (err) => {
        console.error('Error opening archive',err);
    });
};
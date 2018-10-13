importScripts('archive-reader.js');
importScripts('wasm-module.js');
var Module = new WasmModule();
importScripts('wasm-gen/libarchive.js');
const reader = new ArchiveReader(Module);

let busy = false;

onmessage = async ({msg: data}) => {

    if( busy ){
        postMessage({ type: 'BUSY' });
        return;
    }

    let skipExtraction = false;
    busy = true;
    try{
        switch(msg.type){
            case 'OPEN':
                await reader.open(msg.file);
                postMessage({ type: 'OPENED' });
                break;
            case 'LIST_FILES':
                skipExtraction = true;
            case 'EXTRACT_FILES':
                for( entry of reader.entries(skipExtraction) ){
                    postMessage({ type: 'ENTRY', entry });
                }
                break;
            default:
                throw new Error('Invalid Command');
        }
    }catch(err){
        postMessage({ type: 'ERROR', error: err });
    }finally{
        busy = false;
    }
};
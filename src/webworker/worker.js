importScripts('archive-reader.js');
importScripts('wasm-module.js');
var Module = new WasmModule();
importScripts('wasm-gen/libarchive.js');
let reader = null;
let busy = false;

Module.ready = () => {
    reader = new ArchiveReader(Module);
    busy = false;
    self.postMessage({type: 'READY'});
};

onmessage = async ({data: msg}) => {

    if( busy ){
        self.postMessage({ type: 'BUSY' });
        return;
    }

    let skipExtraction = false;
    busy = true;
    try{
        switch(msg.type){
            case 'HELLO': // module will respond READY when it's ready
                break;
            case 'OPEN':
                await reader.open(msg.file);
                self.postMessage({ type: 'OPENED' });
                break;
            case 'LIST_FILES':
                skipExtraction = true;
            case 'EXTRACT_FILES':
                for( entry of reader.entries(skipExtraction) ){
                    self.postMessage({ type: 'ENTRY', entry });
                }
                self.postMessage({ type: 'END' })
                break;
            default:
                throw new Error('Invalid Command');
        }
    }catch(err){
        self.postMessage({ 
            type: 'ERROR', 
            error: {
                message: err.message,
                name: err.name,
                stack: err.stack
            } 
        });
    }finally{
        busy = false;
    }
};
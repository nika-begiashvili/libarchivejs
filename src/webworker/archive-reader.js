
class ArchiveReader{
    /**
     * archive reader
     * @param {WasmModule} wasmModule emscripten module 
     */
    constructor(wasmModule){
        this._wasmModule = wasmModule;
        this._file = null;
    }

    /**
     * open archive, needs to closed manually
     * @param {File} file 
     */
    open(file){
        if( this._file !== null ){
            console.warn('Closing previous file');
            this.close();
        }
        const { promise, resolve, reject } = this._promiseHandles();
        this._file = file;
        const reader = new FileReader();
        reader.onload = () => this._loadFile(reader.result,resolve,reject);
        reader.readAsArrayBuffer(file);
        return promise;
    }

    /**
     * close archive
     */
    close(){
        this._wasmModule.run.closeArchive(this._archive);
        Module._free(this._filePtr);
        this._file = null;
        this._filePtr = null;
        this._archive = null;
    }

    /**
     * read archive entry
     */
    *entries(){
        let entry = 1;
        while( true ){
            entry = this._wasmModule.run.getNextEntry(this._archive);
            if( entry === 0 ) break;
            const fileSize = this._wasmModule.run.getEntrySize(entry);
            const filePath = this._wasmModule.run.getEntryName(entry);
            const type = this._wasmModule.run.getEntryType(entry);
            console.log(`file size: ${fileSize}, file path: ${filePath}, type: ${type}`);
            const ptr = this._wasmModule.run.getFileData(this._archive,fileSize);
            console.log('file ptr: ',ptr);
            const data = Module.HEAP8.slice(ptr,ptr+fileSize);
            console.log(ptr);
            console.log(Module.HEAP8.length);
            console.log(ptr+fileSize);
            console.log(Module.HEAP8[ptr]);
            //Module._free(ptr);

            if( type === 32768 ){
                let fileName = filePath.split('/');
                fileName = fileName[fileName.length - 1];
                yield new File([data], fileName, {
                    type: 'application/octet-stream'
                });
            }
        }
    }

    _loadFile(fileBuffer,resolve,reject){
        try{
            console.log('HEAP SIZE: ', Module.HEAP8.byteLength / 1024 / 1024, ' MB');
            const array = new Uint8Array(fileBuffer);
            this._filePtr = Module._malloc(array.length);
            console.log('malloc',this._filePtr);
            Module.HEAP8.set(array, this._filePtr);
            console.log('copy complete');
            this._archive = this._wasmModule.run.openArchive( this._filePtr, array.length );
            console.log('HEAP SIZE: ', Module.HEAP8.byteLength / 1024 / 1024, ' MB');
            resolve();
        }catch(error){
            reject(error);
        }
    }

    _promiseHandles(){
        let resolve = null,reject = null;
        const promise = new Promise((_resolve,_reject) => {
            resolve = _resolve;
            reject = _reject;
        });
        return { promise, resolve, reject };
    }
    
}
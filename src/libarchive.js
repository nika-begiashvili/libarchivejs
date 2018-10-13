

export class Archive{

    /**
     * Initialize libarchivejs
     * @param {Object} options 
     */
    static init(options = {}){
        Archive._options = {
            workerUrl: 'webworker/worker.js',
            ...options
        };
    }

    /**
     * Creates new archive instance from browser native File object
     * @param {File} file
     * @returns {Archive}
     */
    static open(file, fileExtractCallback){
        if( !Archive._options ){
            Archive.init();
            console.warn('Automatically initializing using options: ', Archive._options);
        }
        return new Archive(file,Archive._options,fileExtractCallback);
    }

    /**
     * Create new archive
     * @param {File} file 
     * @param {Object} options 
     * @param {Function} extractCallback 
     */
    constructor(file,options,extractCallback){
        this._worker = new Worker(options.workerUrl);
        this._worker.addEventListener('message', this._workerMsg.bind(this));
        this._extractCallback = extractCallback;
    }

    
    async listFiles(){
        
    }

    _workerMsg(e){
        
    }


}
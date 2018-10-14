class WasmModule{
    constructor(){
        this.preRun = [];
        this.postRun = [];
        this.totalDependencies = 0;
    }

    onRuntimeInitialized(){
        console.log('module initialized');
        this.runCode = {
          // const char * get_version()
          getVersion: Module.cwrap('get_version', 'string', []),
          // void * archive_open( const void * buffer, size_t buffer_size)
          // retuns archive pointer
          openArchive: Module.cwrap('archive_open', 'number', ['number','number']),
          // void * get_entry(void * archive)
          // return archive entry pointer
          getNextEntry: Module.cwrap('get_next_entry', 'number', ['number']),
          // void * get_filedata( void * archive, size_t bufferSize )
          getFileData: Module.cwrap('get_filedata', 'number', ['number','number']),
          // int archive_read_data_skip(struct archive *_a)
          skipEntry: Module.cwrap('archive_read_data_skip', 'number', ['number']),
          // void archive_close( void * archive )
          closeArchive: Module.cwrap('archive_close', null, ['number'] ),
          // la_int64_t archive_entry_size( struct archive_entry * )
          getEntrySize: Module.cwrap('archive_entry_size', 'number', ['number']),
          // const char * archive_entry_pathname( struct archive_entry * )
          getEntryName: Module.cwrap('archive_entry_pathname', 'string', ['number']),
          // __LA_MODE_T archive_entry_filetype( struct archive_entry * )
          /*
          #define AE_IFMT		((__LA_MODE_T)0170000)
          #define AE_IFREG	((__LA_MODE_T)0100000) // Regular file
          #define AE_IFLNK	((__LA_MODE_T)0120000) // Sybolic link
          #define AE_IFSOCK	((__LA_MODE_T)0140000) // Socket
          #define AE_IFCHR	((__LA_MODE_T)0020000) // Character device
          #define AE_IFBLK	((__LA_MODE_T)0060000) // Block device
          #define AE_IFDIR	((__LA_MODE_T)0040000) // Directory
          #define AE_IFIFO	((__LA_MODE_T)0010000) // Named pipe
          */
          getEntryType: Module.cwrap('archive_entry_filetype', 'number', ['number']),
          // const char * archive_error_string(struct archive *); 
          getError: Module.cwrap('archive_error_string', 'string', ['number']),
          
          malloc: Module.cwrap('malloc', 'number', ['number']),
          free: Module.cwrap('free', null, ['number']),
        };
        console.log(this.runCode.getVersion());
        if(this.ready)  this.ready();
    }

    print(...text){
        console.log(text);
    }

    printErr(...text){
        console.error(text);
    }

    monitorRunDependencies(left){}

    locateFile(path,prefix = ''){
        return `wasm-gen/${prefix}${path}`;
    }

}

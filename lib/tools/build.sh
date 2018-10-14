emcc ../wrapper/main.c -I /home/ubuntu/libarchive-3.3.2/libarchive -o ../build/main.o

emcc ../build/main.o ../build/libarchive.a /usr/local/lib/liblzma.so -o ../build/libarchive.js -s USE_ZLIB=1 -s WASM=1 -O3 -s ALLOW_MEMORY_GROWTH=1 \
-s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' -s EXPORTED_FUNCTIONS='["_get_version","_archive_open","_get_next_entry","_get_filedata","_archive_close","_archive_entry_filetype","_archive_entry_pathname","_archive_entry_pathname_utf8","_archive_entry_size","_archive_read_data_skip","_archive_error_string","_free","_malloc"]'

cp ../build/libarchive.js ../../src/webworker/wasm-gen/
cp ../build/libarchive.wasm ../../src/webworker/wasm-gen/

echo Done

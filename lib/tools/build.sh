#emcc ../wrapper/main.c -I /home/ubuntu/libarchive-3.3.2/libarchive -o ../build/main.o
emcc ../wrapper/main.c -I /home/ubuntu/libarchive-3.4.0/libarchive -o ../build/main.o

emcc ../build/main.o ../build/libarchive.a /usr/local/lib/liblzma.so -o ../build/libarchive.js \
    -s USE_ZLIB=1 -s USE_BZIP2=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=libarchive -s WASM=1 -O3 -s ALLOW_MEMORY_GROWTH=1 \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap","allocate","intArrayFromString"]' -s EXPORTED_FUNCTIONS=@$PWD/lib.exports -s ERROR_ON_UNDEFINED_SYMBOLS=0

cp ../build/libarchive.js ../../src/webworker/wasm-gen/
cp ../build/libarchive.wasm ../../src/webworker/wasm-gen/

echo Done

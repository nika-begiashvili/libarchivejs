emcc main.c -I /home/ubuntu/libarchive-3.3.2/libarchive -o main.o

emcc main.o libarchive.a -o final.html -s WASM=1 -O3 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' -s EXPORTED_FUNCTIONS='["_get_version","_archive_open","_get_next_entry","_get_filedata","_archive_close","_archive_entry_filetype","_archive_entry_pathname","_archive_entry_pathname_utf8","_archive_entry_size","_free"]'

rm final.html

cp -R ../libarchivejs /vagrant/

echo Done

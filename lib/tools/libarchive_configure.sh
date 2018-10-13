export CPPFLAGS=-I/usr/local/include/
export LIBS="-L/usr/local/lib -lz"
export LDFLAGS="-L/usr/local/lib -lz"

emconfigure ./configure --enable-static --disable-shared --enable-bsdtar=static --enable-bsdcat=static --enable-bsdcpio=static --enable-posix-regex-lib=libc \
--disable-xattr --disable-acl \
--without-bz2lib --without-iconv --without-libiconv-prefix --without-lz4 --without-lzma --without-lzo2 --without-cng \
--without-nettle --without-openssl --without-xml2 --without-expat --libdir=/home/ubuntu/libarchive-3.3.2/target

emmake make

emmake make install

cp /home/ubuntu/libarchive-3.3.2/target/libarchive.a /vagrant/libarchivejs/lib/build


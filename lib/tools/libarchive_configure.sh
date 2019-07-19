export CPPFLAGS=-I/usr/local/include/
export LDLIBS="-lz -lbz2 -lgmp"
export LDFLAGS="-L/usr/local/lib"

emconfigure ./configure --enable-static --disable-shared --enable-bsdtar=static --enable-bsdcat=static --enable-bsdcpio=static --enable-posix-regex-lib=libc \
--disable-xattr --disable-acl \
--without-cng  --without-lz4 \
 --without-xml2 --without-expat --libdir=/home/ubuntu/libarchive-3.4.0/target

#--without-nettle --without-openssl
#--without-bz2lib --without-iconv --without-libiconv-prefix --without-lz4 --without-lzma --without-lzo2

emmake make

emmake make install

cp /home/ubuntu/libarchive-3.4.0/target/libarchive.a /vagrant/libarchivejs/lib/build


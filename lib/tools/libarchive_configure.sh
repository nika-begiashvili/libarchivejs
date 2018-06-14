emconfigure ./configure --enable-static --disable-shared --disable-bsdtar --disable-bsdcat --disable-bsdcpio --enable-posix-regex-lib=libc --disable-xattr --disable-acl \
--disable-largefile --without-bz2lib --without-iconv --without-libiconv-prefix --without-lz4 --without-lzma --without-lzo2 --without-cng \
--without-nettle --without-openssl --without-xml2 --without-expat --libdir=/home/ubuntu/libarchive-3.3.2/target

emmake make

emmake make install

# TODO install libarchive

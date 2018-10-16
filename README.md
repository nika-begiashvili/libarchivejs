# libarchivejs

## Overview

libarchivejs is port of libarchive to WebAssembly and javascript wrapper to extract archive files inside browser with nativish performance

```js
            import {Archive} from 'libarchivejs/main.js';

            Archive.init({
                workerUrl: 'libarchivejs/dist/worker-bundle.js'
            });

            document.getElementById('file').addEventListener('change', async (e) => {
                const file = e.currentTarget.files[0];

                const archive = await Archive.open(file);
                
                let obj = await archive.extractFiles();
                console.log(obj);
            });
```
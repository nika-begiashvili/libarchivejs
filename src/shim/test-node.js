/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(wasmRoot|crypto)" }] */
    // Referenced in worker-bundle.js, not in main bundle.

// node.js jest shim definitions
//
// __dirname is relative to test/node/, as it is evaluated from bundle
// on runtime.

export let wasmRoot = `${__dirname}/../../dist-node/wasm-gen`;
// web-worker package requires a valid URL
export let workerPath = `file:///${__dirname}/../../dist-node/worker-bundle.js`;
export { FileReader } from 'file-api';
export { File } from 'file-api';
export { default as Worker } from 'web-worker';

import { Crypto } from '@peculiar/webcrypto';
export let crypto = new Crypto();


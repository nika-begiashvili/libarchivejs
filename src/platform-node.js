// node.js shim definitions
//
// __dirname is relative to dist-node/, as it is evaluated from bundle
// on runtime.

export let wasmRoot = `${__dirname}/wasm-gen`;
// web-worker package requires a valid URL
export let workerPath = `file:///${__dirname}/worker-bundle.js`;
export { FileReader } from 'file-api';
export { File } from 'file-api';
export { default as Worker } from 'web-worker';

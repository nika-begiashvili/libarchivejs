// node.js shim definitions

export let wasmRoot = 'src/webworker/wasm-gen';
export let workerPath = './dist-node/worker-bundle.js';
export { FileReader } from 'file-api';
export { File } from 'file-api';
export { default as Worker } from 'web-worker';

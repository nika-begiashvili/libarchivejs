import copy from 'rollup-plugin-copy-assets';
import { terser } from "rollup-plugin-terser";
import replace from '@rollup/plugin-replace';

export default [
    {
        input: 'src/webworker/worker.js',
        output: [
            {
                file: 'dist/worker-bundle.js',
                format: 'iife'
            },
        ],
        plugins: [
            copy({
                assets: [
                    './src/webworker/wasm-gen'
                ],
            })
        ].concat( process.env.BUILD === 'production' ? [terser()] : [] ),
    },
    {
        input: 'main.js',
        output: [
            {
                file: 'dist-node/bundle.js',
                format: 'cjs'
            },
        ],
        plugins: [
            replace({
                'shim/browser.js': 'shim/node.js'
            })
        ],
        external: [ 'file-api', 'web-worker' ]
    },
    {
        input: 'src/webworker/worker.js',
        output: [
            {
                file: 'dist-node/worker-bundle.js',
                format: 'cjs'
            },
        ],
        plugins: [
            replace({
                'shim/browser.js': 'shim/node.js'
            }),
            copy({
                assets: [
                    './src/webworker/wasm-gen'
                ],
            })
        ],
        external: [ 'file-api', 'web-worker' ]
    },
    {
        input: 'test/files/tests.js',
        output: [
            {
                file: 'test/node/test-bundle.js',
                format: 'cjs'
            },
        ],
        plugins: [
            replace({
                'shim/browser.js': 'shim/test-node.js'
            })
        ],
        external: [ 'file-api', 'web-worker', '@peculiar/webcrypto' ]
    }
];
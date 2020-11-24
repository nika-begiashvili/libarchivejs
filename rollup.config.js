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
                'platform-browser.js': 'platform-node.js'
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
                'platform-browser.js': 'platform-node.js'
            }),
            copy({
                assets: [
                    './src/webworker/wasm-gen'
                ],
            })
        ],
        external: [ 'file-api', 'web-worker' ]
    }
];
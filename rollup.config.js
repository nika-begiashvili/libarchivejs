import copy from 'rollup-plugin-copy';
import { terser } from "rollup-plugin-terser";
import { nodeResolve } from '@rollup/plugin-node-resolve';
// import { babel } from '@rollup/plugin-babel';

export default [{
  input: "src/webworker/worker.js",
  output: [
    {
      file: "dist/worker-bundle.js",
      format: "es",
    },
  ],
  plugins: [
    nodeResolve(),
    copy({
      targets: [
        { src: 'src/webworker/wasm-gen/libarchive.wasm', dest: 'dist' },
      ]
    })
    // babel({ babelHelpers: 'bundled' }),
  ].concat(process.env.BUILD === "production" ? [terser()] : []),
},
{
  input: "src/libarchive.js",
  output: [
    {
      file: "dist/libarchive.js",
      format: "es",
    },
  ],
  plugins: [
    nodeResolve()
  ].concat(process.env.BUILD === "production" ? [terser()] : []),
}
];

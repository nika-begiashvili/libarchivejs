import copy from "rollup-plugin-copy";
import { terser } from "rollup-plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default [
  {
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
          { src: "src/webworker/wasm-gen/libarchive.wasm", dest: "dist" },
        ],
      }),
      // babel({ babelHelpers: 'bundled' }),
    ].concat(process.env.BUILD === "production" ? [terser()] : []),
  },
  {
    input: "src/libarchive.ts",
    output: [
      {
        file: "dist/libarchive.js",
        format: "es",
      },
    ],
    plugins: [typescript(), nodeResolve()].concat(
      process.env.BUILD === "production" ? [terser()] : [],
    ),
  },
];

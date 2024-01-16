import copy from "rollup-plugin-copy";
import { terser } from "rollup-plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default [
  {
    input: "src/webworker/browser-worker.js",
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
    ].concat(process.env.BUILD === "production" ? [terser()] : []),
  },
  {
    input: "src/webworker/node-worker.js",
    output: [
      {
        file: "dist/worker-bundle-node.mjs",
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
  {
    input: "src/libarchive-node.ts",
    output: [
      {
        file: "dist/libarchive-node.mjs",
        format: "es",
      },
    ],
    plugins: [typescript(), nodeResolve()].concat(
      process.env.BUILD === "production" ? [terser()] : [],
    ),
  },
];

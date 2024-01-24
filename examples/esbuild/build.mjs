import { build } from "esbuild";
import { copy } from "esbuild-plugin-copy";

build({
  entryPoints: ["index.js"],
  bundle: true,
  outfile: "./dist/index.js",
  external: ["./worker-bundle.js"],
  format: "esm",
  plugins: [
    copy({
      resolveFrom: "cwd",
      assets: {
        from: ["node_modules/libarchive.js/dist/*"],
        to: ["./dist/"],
      },
      watch: true,
    }),
  ],
});

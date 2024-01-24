const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./index.js",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "node_modules/libarchive.js/dist/libarchive.wasm",
          to: "libarchive.wasm",
        },
      ],
    }),
  ],
};

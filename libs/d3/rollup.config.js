import {readFileSync} from "fs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import ascii from "rollup-plugin-ascii";
import {terser} from "rollup-plugin-terser";
import * as meta from "./package.json";

// Extract copyrights from the LICENSE.
const copyright = readFileSync("./node_modules/d3-selection/LICENSE", "utf-8")
  .split(/\n/g)
  .filter(line => /^Copyright\s+/.test(line))
  .map(line => line.replace(/^Copyright\s+/, ""))
  .join(", ");

const config = {
  input: "d3_jsroot.js",
  output: {
    file: `../../modules/d3.mjs`,
    name: "d3",
    format: "es",
    indent: false,
    extend: true,
    banner: `// ${meta.homepage} v${meta.version} Copyright ${copyright}`
  },
  plugins: [
    nodeResolve(),
    json(),
    ascii()
  ],
  onwarn(message, warn) {
    if (message.code === "CIRCULAR_DEPENDENCY") return;
    warn(message);
  }
};

export default [
  config,
  {
    ...config,
    output: {
      ...config.output,
      file: `../d3.mjs`
    },
    plugins: [
      ...config.plugins,
      terser({
        output: {
          preamble: config.output.banner
        },
        mangle: {
          reserved: [
            "InternMap",
            "InternSet"
          ]
        }
      })
    ]
  }
];

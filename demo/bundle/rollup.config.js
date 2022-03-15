import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import ascii from "rollup-plugin-ascii";
import {terser} from "rollup-plugin-terser";
import * as meta from "../../package.json";
import ignore from "rollup-plugin-ignore";

const ingnore_modules = ['fs'];

for(let key in meta.dependencies)
   ingnore_modules.push(key);

const config = {
  input: "jsroot_hist.mjs",
  output: {
    dir: "bundle",
    format: "es",
    indent: false,
    extend: true,
    banner: `// ${meta.homepage} v${meta.version}`
  },
  plugins: [
    ignore(ingnore_modules),
    nodeResolve(),
    json(),
    ascii()
  ],
  onwarn(message, warn) {
    if (message.code === "CIRCULAR_DEPENDENCY") return;
    warn(message);
  }
};

const config_2d = {
   ...config,
   input: "jsroot_hist2d.mjs"
}

const config_minified = {
   ...config,
    output: {
      ...config.output,
      dir: "bundle.min"
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

const config_2d_minified = {
   ...config_minified,
   input: "jsroot_hist2d.mjs"
}

export default [
  config,
  config_2d,
  config_minified,
  config_2d_minified
];

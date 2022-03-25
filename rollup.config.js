import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import modify from 'rollup-plugin-modify'
import ascii from "rollup-plugin-ascii";
import {terser} from "rollup-plugin-terser";
import * as meta from "./package.json";
import ignore from "rollup-plugin-ignore";

const ingnore_modules = ['fs'];

for(let key in meta.dependencies)
   ingnore_modules.push(key);

const config = {
  input: "bundle/src/jsroot_full.mjs",
  output: {
    file: "bundle/bld/jsroot_full.mjs",
    format: "es",
    inlineDynamicImports: true,
    indent: false,
    extend: true,
    banner: `// ${meta.homepage} v${meta.version}`
  },
  plugins: [
    modify({
      find: /\bif\(isNodeJs\(\)\).+cutNodeJs\b/,
      replace: ''
     }),
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

const config_hist = {
   ...config,
   input: "bundle/src/jsroot_hist.mjs",
   output: {
      ...config.output,
      file: "bundle/bld/jsroot_hist.mjs",
      inlineDynamicImports: true
   }
}


const config_2d = {
   ...config,
   input: "bundle/src/jsroot_hist2d.mjs",
   output: {
      ...config.output,
      file: "bundle/bld/jsroot_hist2d.mjs",
      inlineDynamicImports: true
   }
}

const config_minified = {
   ...config,
    output: {
      ...config.output,
      file: "bundle/bld/jsroot_full.min.mjs",
      inlineDynamicImports: true
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

const config_hist_minified = {
   ...config_minified,
   input: "bundle/src/jsroot_hist.mjs",
   output: {
     ...config.output,
     file: "bundle/bld/jsroot_hist.min.mjs",
     inlineDynamicImports: true
   }
}


const config_2d_minified = {
   ...config_minified,
   input: "bundle/src/jsroot_hist2d.mjs",
   output: {
     ...config.output,
     file: "bundle/bld/jsroot_hist2d.min.mjs",
     inlineDynamicImports: true
   }
}

export default [
  config,
  config_hist,
  config_2d,
  config_minified,
  config_hist_minified,
  config_2d_minified
];

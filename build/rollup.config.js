import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import modify from 'rollup-plugin-modify';
import ascii from 'rollup-plugin-ascii';
import ignore from 'rollup-plugin-ignore';
import meta from '../package.json' assert { type: 'json' };

const ignore_jsroot_modules = ['./base/lzma.mjs', './base/zstd.mjs', '../../scripts/jspdf.es.min.js', '../../scripts/svg2pdf.es.min.js'];

const external_node_modules = ['mathjax', 'jsdom', 'fs', 'canvas', 'tmp', 'zlib', 'xhr2', '@oneidentity/zstd-js', 'gl'];

// TODO: maybe keep node modules as external to be able use produced builds as well?
const ignore_modules = ignore_jsroot_modules.concat(external_node_modules);

const importMetaUrlPolyfill = `(typeof document === 'undefined' && typeof location === 'undefined' ? undefined : typeof document === 'undefined' ? location.href : (document.currentScript && document.currentScript.src || new URL('jsroot.js', document.baseURI).href));`;

//for(let key in meta.dependencies)
//   ignore_modules.push(key);

const config = {
  input: "modules/main.mjs",
  output: {
    name: "JSROOT",
    file: "build/jsroot.js",
    format: "umd",
    inlineDynamicImports: true,
    indent: false,
    extend: true,
    banner: `// ${meta.homepage} v${meta.version}`
  },
  plugins: [
    modify({
      'import.meta?.url': importMetaUrlPolyfill
    }),
    ignore(ignore_modules),
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
  input: "modules/hist/bundle.mjs",
  output: {
    ...config.output,
    file: "build/hist.js",
    inlineDynamicImports: true
  }
}

const config_2d = {
  ...config,
  input: "modules/hist2d/bundle.mjs",
  output: {
    ...config.output,
    file: "build/hist2d.js",
    inlineDynamicImports: true
  }
}

const config_geom = {
  ...config,
  input: "modules/geom/bundle.mjs",
  output: {
    ...config.output,
    format: 'es',
    file: 'build/geom.mjs',
    inlineDynamicImports: true
  }
}

const config_jsroot_r162 = {
  ...config,
  input: "libs/r162/main.mjs",
  output: {
    ...config.output,
    format: 'es',
    file: 'build/jsroot_r162.mjs',
    inlineDynamicImports: true
  },
  external: external_node_modules,
  plugins: [
    modify({
      "from '../three.mjs'": "from '../../libs/r162/three.mjs'",
      "from '../three_addons.mjs'": "from '../../libs/r162/three_addons.mjs'",
      'import.meta?.url': importMetaUrlPolyfill
    }),
    ignore(ignore_jsroot_modules),
    json(),
    ascii()
  ],
}

const config_geom_nothreejs = {
  ...config,
  input: "modules/geom/bundle.mjs",
  external: ['three', 'three/addons'],
  output: {
    ...config.output,
    format: 'es',
    file: 'build/geom_nothreejs.mjs',
    inlineDynamicImports: true
  },
  plugins: [
    modify({
      "from '../three.mjs'": "from 'three'",
      "from '../three_addons.mjs'": "from 'three/addons'",
      'import.meta?.url': importMetaUrlPolyfill
    }),
    ignore(ignore_modules),
    nodeResolve(),
    json(),
    ascii()
  ],
}

const config_minified = {
  ...config,
  output: {
    ...config.output,
    file: "build/jsroot.min.js",
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
  input: "modules/hist/bundle.mjs",
  output: {
    ...config.output,
    file: "build/hist.min.js",
    inlineDynamicImports: true
  }
}

const config_2d_minified = {
  ...config_minified,
  input: "modules/hist2d/bundle.mjs",
  output: {
    ...config.output,
    file: "build/hist2d.min.js",
    inlineDynamicImports: true
  }
}

export default [
  config,
  config_jsroot_r162,
  config_hist,
  config_2d,
  config_geom,
  config_geom_nothreejs,
  config_minified,
  config_hist_minified,
  config_2d_minified
];

import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import meta from '../package.json' with { type: 'json' };

const ignore_jsroot_modules = ['./base/lzma.mjs', './base/zstd.mjs'],

      external_node_modules = ['mathjax', 'jsdom', 'fs', 'canvas', 'tmp', 'zlib', 'xhr2', 'node:worker_threads', '@oneidentity/zstd-js', '@resvg/resvg-js', 'gl', 'three', 'three/addons'],

      external_modules = ignore_jsroot_modules.concat(external_node_modules),

      config = {
         input: 'modules/main.mjs',
         output: {
            name: 'JSROOT',
            file: 'build/jsroot.js',
            format: 'umd',
            inlineDynamicImports: true,
            indent: false,
            extend: true,
            banner: `// ${meta.homepage} v${meta.version}`
         },
         external: external_modules,
         plugins: [
            nodeResolve(),
            json()
         ],
         onwarn(message, warn) {
            if (message.code === 'CIRCULAR_DEPENDENCY')
               return;
            warn(message);
         }
      },

      config_hist = {
         ...config,
         input: 'modules/hist/bundle.mjs',
         output: {
            ...config.output,
            file: 'build/hist.js',
            inlineDynamicImports: true
         }
      },

      config_2d = {
         ...config,
         input: 'modules/hist2d/bundle.mjs',
         output: {
            ...config.output,
            file: 'build/hist2d.js',
            inlineDynamicImports: true
         }
      },

      config_geom = {
         ...config,
         input: 'modules/geom/bundle.mjs',
         output: {
            ...config.output,
            format: 'es',
            file: 'build/geom.mjs',
            inlineDynamicImports: true
         }
      },

      config_geom_nothreejs = {
         ...config,
         input: 'modules/geom/bundle.mjs',
         external: ['three', 'three/addons'],
         output: {
            ...config.output,
            format: 'es',
            file: 'build/geom_nothreejs.mjs',
            inlineDynamicImports: true
         },
         external: external_modules,
         plugins: [
            replace({
               delimiters: ['', ''],
               preventAssignment: true,
               "from '../three.mjs'": "from 'three'",
               "from '../three_addons.mjs'": "from 'three/addons'",
            }),
            nodeResolve(),
            json()
         ],
      },

      config_minified = {
         ...config,
         output: {
            ...config.output,
            file: 'build/jsroot.min.js',
            inlineDynamicImports: true
         },
         plugins: [
            ...config.plugins,
            terser({
               output: {
                  preamble: config.output.banner
               },
               mangle: {
                  reserved: ['InternMap', 'InternSet']
               }
            })
         ]
      },

      config_hist_minified = {
         ...config_minified,
         input: 'modules/hist/bundle.mjs',
         output: {
            ...config.output,
            file: 'build/hist.min.js',
            inlineDynamicImports: true
         }
      },

      config_2d_minified = {
         ...config_minified,
         input: 'modules/hist2d/bundle.mjs',
         output: {
            ...config.output,
            file: 'build/hist2d.min.js',
            inlineDynamicImports: true
         }
      };

export default [
   config,
   config_hist,
   config_2d,
   config_geom,
   config_geom_nothreejs,
   config_minified,
   config_hist_minified,
   config_2d_minified
];

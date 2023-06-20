import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import MagicString from 'magic-string';

function addons(output_file) {

	return {

		transform( code, id ) {

			if ( /\/examples\/jsm\//.test( id ) === false ) return;

         code = new MagicString( code );

			code = code.replace(output_file, '../../../threejs/src/Three_jsroot.js' ).replace( 'three', '../../../src/Three_jsroot.js' );

			return {
				code: code.toString(),
				map: code.generateMap().toString()
			};

		}

	};

}

export function glsl() {

   return {

      transform( code, id ) {

         if ( /\.glsl.js$/.test( id ) === false ) return;

         code = new MagicString( code );

         code.replace( /\/\* glsl \*\/\`(.*?)\`/sg, function ( match, p1 ) {

            return JSON.stringify(
               p1
                  .trim()
                  .replace( /\r/g, '' )
                  .replace( /[ \t]*\/\/.*\n/g, '' ) // remove //
                  .replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' ) // remove /* */
                  .replace( /\n{2,}/g, '\n' ) // # \n+ to \n
            );

         } );

         return {
            code: code.toString(),
            map: code.generateMap().toString()
         };

      }

   };

}

function header() {

	return {

		renderChunk( code ) {

			return `/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
${ code }`;

		}

	};

}

let builds = [
	{
		input: '../../../threejs/src/Three_jsroot.js',
		plugins: [
			addons('../../modules/three.mjs'),
			glsl(),
			json({ compact: true, indent: "" }),
			header()
		],
		output: [
			{
				format: 'es',
				name: 'THREE',
				file: '../../modules/three.mjs',
				indent: '\t'
			}
		]
	},
	{
		input: '../../../threejs/src/Three_jsroot.js',
		plugins: [
			addons('../three.mjs'),
			glsl(),
			json({ compact: true, indent: "" }),
			terser(),
			header()
		],
		output: [
			{
				format: 'es',
				name: 'THREE',
				file: '../three.mjs'
			}
		]
	}
];


if ( process.env.ONLY_MODULE === 'true' ) {

	builds = builds[ 0 ];

}

export default builds;

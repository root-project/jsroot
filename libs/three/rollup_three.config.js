import terser from '@rollup/plugin-terser';
import MagicString from 'magic-string';

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
				map: code.generateMap()
			};

		}

	};

}

function header() {

	return {

		renderChunk( code ) {

			code = new MagicString( code );

			code.prepend( `/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */\n` );

			return {
				code: code.toString(),
				map: code.generateMap()
			};

		}

	};

}

function import_three() {
	return {
		renderChunk( code ) {
			return code.replace("from 'three'", "from './three.mjs'");
		}

	};
}

/**
 * @type {Array<import('rollup').RollupOptions>}
 */
const builds = [
	{
		input: {
			'three.mjs': '../../../threejs/src/Three_jsroot.js'
		},
		plugins: [
			glsl(),
			header()
		],
		preserveEntrySignatures: 'allow-extension',
		output: [
			{
				format: 'esm',
				dir: '../../modules',
				minifyInternalExports: false,
				entryFileNames: '[name]',
			}
		]
	},
	{
		input: {
			'three.mjs': '../../../threejs/src/Three_jsroot.js'
		},
		plugins: [
			glsl(),
			header(),
			terser()
		],
		preserveEntrySignatures: 'allow-extension',
		output: [
			{
				format: 'esm',
				dir: '..',
				minifyInternalExports: false,
				entryFileNames: '[name]',
			}
		]
	},
	{
		input: {
			'three_addons.mjs': '../../../threejs/src/Three_addons.js'
		},
		external: ['three'],
		plugins: [
			glsl(),
			import_three(),
			header()
		],
		preserveEntrySignatures: 'allow-extension',
		output: [
			{
				format: 'esm',
				dir: '../../modules',
				minifyInternalExports: false,
				entryFileNames: '[name]',
			}
		]
	},
	{
		input: {
			'three_addons.mjs': '../../../threejs/src/Three_addons.js'
		},
		external: ['three'],
		plugins: [
			glsl(),
			import_three(),
			header(),
			terser()
		],
		preserveEntrySignatures: 'allow-extension',
		output: [
			{
				format: 'esm',
				dir: '..',
				minifyInternalExports: false,
				entryFileNames: '[name]',
			}
		]
	},

];

export default builds;

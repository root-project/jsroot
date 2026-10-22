import stylisticJs from '@stylistic/eslint-plugin';
import jsdoc from 'eslint-plugin-jsdoc';

import globals from 'globals';

import { defineConfig } from 'eslint/config';

export default defineConfig([ {
   languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {...globals.browser, ...globals.node, MathJax : 'readonly'}
   },
   plugins: {'@stylistic/js': stylisticJs, jsdoc},
   rules: {
      'jsdoc/check-access': 0, // Recommended
      'jsdoc/check-alignment': 0, // Recommended
      'jsdoc/check-indentation': 0,
      'jsdoc/check-line-alignment': 0,
      'jsdoc/check-param-names': 0, // Recommended
      'jsdoc/check-property-names': 0, // Recommended
      'jsdoc/check-syntax': 0,
      'jsdoc/check-tag-names': 0, // Recommended
      'jsdoc/check-template-names': 0,
      'jsdoc/check-types': 0, // Recommended
      'jsdoc/check-values': 0, // Recommended
      'jsdoc/convert-to-jsdoc-comments': 0,
      'jsdoc/empty-tags': 0, // Recommended
      'jsdoc/escape-inline-tags': 0, // Recommended for TS configs
      'jsdoc/implements-on-classes': 0, // Recommended
      'jsdoc/imports-as-dependencies': 0,
      'jsdoc/informative-docs': 0,
      'jsdoc/lines-before-block': 0,
      'jsdoc/match-description': 0,
      'jsdoc/match-name': 0,
      'jsdoc/multiline-blocks': 0, // Recommended
      'jsdoc/no-bad-blocks': 0,
      'jsdoc/no-blank-block-descriptions': 0,
      'jsdoc/no-defaults': 0, // Recommended
      'jsdoc/no-missing-syntax': 0,
      'jsdoc/no-multi-asterisks': 0, // Recommended
      'jsdoc/no-restricted-syntax': 0,
      'jsdoc/no-types': 0, // Recommended for TS configs
      'jsdoc/no-undefined-types': 0, // Recommended for non-TS configs
      'jsdoc/no-unnecessary-type-assertion': 0,
      'jsdoc/normalize-see-links': 0,
      'jsdoc/prefer-import-tag': 0,
      'jsdoc/reject-any-type': 0, // Recommended
      'jsdoc/reject-function-type': 0, // Recommended
      'jsdoc/require-asterisk-prefix': 0,
      'jsdoc/require-description': 0,
      'jsdoc/require-description-complete-sentence': 0,
      'jsdoc/require-example': 0,
      'jsdoc/require-file-overview': 0,
      'jsdoc/require-hyphen-before-param-description': 0,
      'jsdoc/require-jsdoc': 0, // Recommended
      'jsdoc/require-next-description': 0,
      'jsdoc/require-next-type': 0, // Recommended
      'jsdoc/require-param-description': 0, // Recommended
      'jsdoc/require-param-name': 1, // Recommended
      'jsdoc/require-param-type': 1, // Recommended in non-TS configs
      'jsdoc/require-param': 0, // Recommended
      'jsdoc/require-property-description': 1, // Recommended
      'jsdoc/require-property-name': 1, // Recommended
      'jsdoc/require-property-type': 1, // Recommended in non-TS configs
      'jsdoc/require-property': 1, // Recommended
      'jsdoc/require-rejects': 0, // Recommended
      'jsdoc/require-returns-check': 1, // Recommended
      'jsdoc/require-returns-description': 1, // Recommended
      'jsdoc/require-returns-type': 1, // Recommended in non-TS configs
      'jsdoc/require-returns': 0, // Recommended  ?????
      'jsdoc/require-tags': 0,
      'jsdoc/require-template': 0,
      'jsdoc/require-template-description': 0,
      'jsdoc/require-throws': 0,
      'jsdoc/require-throws-description': 1,
      'jsdoc/require-throws-type': 1, // Recommended
      'jsdoc/require-yields-check': 1, // Recommended
      'jsdoc/require-yields-description': 0,
      'jsdoc/require-yields-type': 1, // Recommended
      'jsdoc/require-yields': 1, // Recommended
      'jsdoc/sort-tags': 0,
      'jsdoc/tag-lines': 0, // Recommended     ??????
      'jsdoc/text-escaping': 0,
      'jsdoc/ts-ban-ts-comment': 0,
      'jsdoc/ts-method-signature-style': 0,
      'jsdoc/ts-no-empty-object-type': 1, // Recommended
      'jsdoc/ts-no-unnecessary-template-expression': 0,
      'jsdoc/ts-prefer-function-type': 0,
      'jsdoc/type-formatting': 0,
      'jsdoc/valid-types': 1, // Recommended
      'array-callback-return': 'error',
      'consistent-return': 'off',
      camelcase: 'off',
      'default-case-last': 'error',
      eqeqeq: 'warn',
      curly: [ 'warn', 'multi-or-nest' ],
      'one-var': [ 'warn', 'consecutive' ],
      'no-new-func': 'off',
      'no-unused-vars': 'error',
      'no-use-before-define':
         [ 'error', {functions : true, classes : true, variables : true, allowNamedExports : false} ],
      'no-unreachable-loop': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-else-return': 'warn',
      'no-extra-bind': 'error',
      'no-extra-boolean-cast': 'warn',
      'no-implicit-coercion': 'warn',
      'for-direction': 'error',
      'no-undef': 'warn',
      'no-await-in-loop': 'warn',
      'no-class-assign': 'error',
      'no-cond-assign': 'warn',
      'no-constructor-return': 'error',
      'no-duplicate-imports': 'error',
      'no-promise-executor-return': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'warn',
      'no-useless-assignment': 'warn',
      'no-implicit-globals': 'warn',
      'no-invalid-this': 'off',
      'no-labels': 'error',
      'no-lonely-if': 'warn',
      'no-return-assign': 'warn',
      'no-shadow': 'warn',
      'no-throw-literal': 'warn',
      'no-unneeded-ternary': 'warn',
      'no-unused-expressions': 'warn',
      'no-useless-call': 'warn',
      'no-useless-computed-key': 'warn',
      'no-useless-constructor': 'warn',
      'no-useless-rename': 'warn',
      'no-useless-return': 'warn',
      'no-var': 'error',
      'no-void': 'error',
      'object-shorthand': 'warn',
      'operator-assignment': [ 'warn', 'always' ],
      'prefer-arrow-callback': 'warn',
      'prefer-const': 'warn',
      'prefer-numeric-literals': 'warn',
      'prefer-object-has-own': 'warn',
      'prefer-promise-reject-errors': 'warn',
      'prefer-rest-params': 'warn',
      'prefer-spread': 'warn',
      'prefer-template': 'off',

      // moved to @stylistic/js
      '@stylistic/js/semi': 'warn',
      '@stylistic/js/quotes': [ 'warn', 'single' ],
      '@stylistic/js/indent': [
         'warn', 3, {
            ignoredNodes : [ 'ConditionalExpression', 'ExportNamedDeclaration' ],
            ImportDeclaration : 'off',
            VariableDeclarator : 'first',
            ArrayExpression : 'first',
            MemberExpression : 'off',
            FunctionDeclaration : {parameters : 'first'},
            CallExpression : {arguments : 'first'},
            SwitchCase : 1
         }
      ],
      '@stylistic/js/eol-last': [ 'warn', 'always' ],
      '@stylistic/js/array-bracket-spacing': 'warn',
      '@stylistic/js/comma-spacing': 'warn',
      '@stylistic/js/max-len':
         [ 'warn', {code : 200, ignoreStrings : true, ignoreTemplateLiterals : true, tabWidth : 3} ],
      '@stylistic/js/max-statements-per-line': [ 'warn', {max : 2, ignoredNodes : [ 'BreakStatement' ]} ],
      '@stylistic/js/keyword-spacing': 'warn',
      '@stylistic/js/semi-spacing': 'warn',
      '@stylistic/js/semi-style': [ 'warn', 'last' ],
      '@stylistic/js/no-floating-decimal': 'warn',
      '@stylistic/js/no-confusing-arrow': 'warn',
      '@stylistic/js/no-extra-semi': 'warn',
      '@stylistic/js/no-mixed-spaces-and-tabs': 'warn',
      '@stylistic/js/no-multi-spaces': [ 'warn', {ignoreEOLComments : true} ],
      '@stylistic/js/no-multiple-empty-lines': [ 'warn', {max : 2, maxEOF : 0} ],
      '@stylistic/js/no-trailing-spaces': 'warn',
      '@stylistic/js/no-whitespace-before-property': 'warn',
      '@stylistic/js/object-curly-spacing': [ 'warn', 'always' ],
      '@stylistic/js/key-spacing': 'warn',
      '@stylistic/js/object-property-newline': 'off',
      '@stylistic/js/spaced-comment': 'warn',
      '@stylistic/js/computed-property-spacing': 'warn',
      '@stylistic/js/object-curly-newline': [
         'warn', {
            ObjectExpression : {consistent: true},
            ObjectPattern : {consistent: true},
            ImportDeclaration : 'never',
            ExportDeclaration : 'never'
         }
      ],
      '@stylistic/js/quote-props': [ 'warn', 'as-needed' ],
      '@stylistic/js/padded-blocks': [ 'warn', {blocks : 'never', classes : 'always', switches : 'never'} ],
      '@stylistic/js/space-infix-ops': 'warn',
      '@stylistic/js/space-in-parens': 'warn',
      '@stylistic/js/space-before-blocks': 'warn',
      '@stylistic/js/space-before-function-paren': [ 'warn', 'never' ],
      '@stylistic/js/switch-colon-spacing': 'warn',
      '@stylistic/js/template-curly-spacing': 'error'
   }
} ]);

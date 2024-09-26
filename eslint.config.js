import stylisticJs from '@stylistic/eslint-plugin-js';

export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      '@stylistic/js': stylisticJs
    },
    rules: {
        camelcase: 'off',
        'prefer-const': 'warn',
        eqeqeq: 'warn',
        curly: ['warn', 'multi-or-nest'],
        'one-var': ['warn', 'consecutive'],
        'no-new-func': 'off',

        // moved to @stylistic/js
        '@stylistic/js/semi': 'warn',
        '@stylistic/js/quotes': ['warn', 'single'],
        '@stylistic/js/indent': 'off',
        '@stylistic/js/array-bracket-spacing': 'warn',
        '@stylistic/js/comma-spacing': 'warn',
        '@stylistic/js/keyword-spacing': 'warn',
        '@stylistic/js/semi-spacing': 'warn',
        '@stylistic/js/no-floating-decimal': 'warn',
        '@stylistic/js/no-multi-spaces': ['warn', { ignoreEOLComments: true }],
        '@stylistic/js/no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 0 }],
        '@stylistic/js/object-curly-spacing': ['warn', 'always'],
        '@stylistic/js/space-in-parens': 'warn',
        '@stylistic/js/key-spacing': 'warn',
        '@stylistic/js/object-property-newline': 'off',
        '@stylistic/js/spaced-comment': 'warn',
        '@stylistic/js/computed-property-spacing': 'warn',
        '@stylistic/js/object-curly-newline': ['warn', {
          ObjectExpression: { 'consistent': true },
          ObjectPattern: { 'consistent': true },
          ImportDeclaration: 'never',
          ExportDeclaration: 'never'
        }],
        '@stylistic/js/padded-blocks': ['warn', { blocks: 'never', classes: 'always', switches: 'never' }],
        '@stylistic/js/space-infix-ops': 'off',
        '@stylistic/js/space-before-function-paren': ['warn', 'never']
    }
  }
];


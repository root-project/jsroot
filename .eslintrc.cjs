module.exports = {
  "env": {
      "browser": true,
      "es2021": true
  },
  extends: [
    'semistandard'
  ],
  "parserOptions": {
      "ecmaVersion": "latest",
      "sourceType": "module"
  },
  "ignorePatterns" : ["modules/base/zstd.mjs", "modules/three.mjs", "modules/d3.mjs", "modules/gui/lil-gui.mjs"],
  "rules": {
      "quotes": ["warn", "single"],
      "indent": "off",
      "camelcase": "off",
      "space-before-function-paren": ["warn", "never"],
      "comma-spacing": "warn",
      "keyword-spacing": "warn",
      "prefer-const": "warn",
      "eqeqeq": "warn",
      "spaced-comment": "warn",
      "array-bracket-spacing": "warn",
      "key-spacing": "warn",
      "space-in-parens": "warn",
      "computed-property-spacing": "warn",
      "object-curly-spacing": "warn",
      "semi-spacing": "warn",
      "no-floating-decimal": "warn",
      "semi": "warn",
      "object-curly-newline": ["warn", {
        "ObjectExpression": { "consistent": true },
        "ObjectPattern": { "consistent": true },
        "ImportDeclaration": "never",
        "ExportDeclaration": "never"
      }],
      "curly": ["warn", "multi-or-nest"],
      "one-var": ["warn", "consecutive"],
      "space-infix-ops": "off",
      "no-multi-spaces": ["warn", { ignoreEOLComments: true }],
      "no-multiple-empty-lines": "off",
      "object-property-newline": "off",
      "promise/param-names": ["warn", { resolvePattern: "^resolve*", rejectPattern: "^reject*" } ],
      "no-new-func": "off",
      "padded-blocks": ["warn", { "blocks": "never", "classes": "always", "switches": "never" }]
  }
};

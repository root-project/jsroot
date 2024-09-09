export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    ignores: ["modules/base/zstd.mjs", "modules/base/lzma.mjs", "modules/d3.mjs", "modules/svg2pdf.mjs", "modules/jspdf.mjs", "modules/three.mjs", "modules/three_addons.mjs", "modules/gui/lil-gui.mjs", "modules/r162/**"],
    rules: {
        semi: "warn",
        quotes: ["warn", "single"],
        indent: "off",
        camelcase: "off",
        "prefer-const": "warn",
        eqeqeq: "warn",
        curly: ["warn", "multi-or-nest"],
        "one-var": ["warn", "consecutive"],
        "no-new-func": "off",

        // deprecated, no idea how to replace
        "object-curly-spacing": "off",
        "array-bracket-spacing": "warn",
        "keyword-spacing": "warn",
        "semi-spacing": "warn",
        "no-floating-decimal": "warn",
        "no-multi-spaces": ["warn", { ignoreEOLComments: true }],
        "no-multiple-empty-lines": "off",
        "space-in-parens": "warn",
        "comma-spacing": "warn",
        "key-spacing": "warn",
        "object-property-newline": "off",
        "spaced-comment": "warn",
        "computed-property-spacing": "warn",
        "object-curly-newline": ["warn", {
          "ObjectExpression": { "consistent": true },
          "ObjectPattern": { "consistent": true },
          "ImportDeclaration": "never",
          "ExportDeclaration": "never"
        }],
        "padded-blocks": ["warn", { "blocks": "never", "classes": "always", "switches": "never" }],
        "space-infix-ops": "off",
        "space-before-function-paren": ["warn", "never"]
    }
  }
];


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
  "rules": {
      "quotes": ["warn", "single"],
      "indent": "off",
      "camelcase": "off",
      "space-before-function-paren": "off",
      "semi": "off",
      "object-curly-newline": "off",
      "curly": ["warn", "multi-or-nest"],
      "one-var": ["warn", "consecutive"],
      "space-infix-ops": "off",
      "no-multi-spaces": "off",
      "no-multiple-empty-lines": "off",
      "object-property-newline": "off",
      "promise/param-names": ["warn", { resolvePattern: "^resolve*", rejectPattern: "^reject*" } ],
      "no-new-func": "off"
  }
};

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
      "space-infix-ops": "off",
      "no-multi-spaces": "off"
  }
};

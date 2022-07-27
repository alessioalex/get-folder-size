"use strict";

module.exports = {

  parserOptions: {
    sourceType: "module",
    ecmaVersion: "latest",
  },

  env: {
    "es2022": true,
    "node": true,
  },

  extends: [
    "eslint:recommended",
  ],

  rules: {
    "comma-style": ["error", "last"],
    "eol-last": ["error", "always"],
    "indent": ["error", 2, {"MemberExpression": "off", "SwitchCase": 1}],
    "semi": ["error", "always"],
  },

};

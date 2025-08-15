module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'next/core-web-vitals'
  ],

  rules: {
    'no-console': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-unreachable': 'off',
    'no-prototype-builtins': 'off'
  },

  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    '*.js',
    '*.d.ts',
  ],
};

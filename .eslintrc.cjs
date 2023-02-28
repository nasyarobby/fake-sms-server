module.exports = {
  extends: [
    'airbnb-base',
    'airbnb-typescript/base'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { "args": "none" }]
  },
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  env: {
    node: true
  },
};
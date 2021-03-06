module.exports = {
  extends: [
    'airbnb-typescript/base',
    'plugin:import/recommended'
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'import/prefer-default-export': 'off',
  },
  ignorePatterns: ['.eslintrc.js']
};
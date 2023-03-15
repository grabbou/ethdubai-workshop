/* eslint-env node */

require('@uniswap/eslint-config/load')

module.exports = {
  extends: '@uniswap/eslint-config/react',
  rules: {
    'import/no-unused-modules': 0,
    '@typescript-eslint/no-restricted-imports': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
  },
}

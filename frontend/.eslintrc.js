
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'next/core-web-vitals'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@next/next/no-html-link-for-pages': 'off',
    'jsx-a11y/alt-text': 'off',
    'no-empty': 'off',
    'react/jsx-no-undef': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'no-useless-escape': 'off',
  },
  ignorePatterns: ['src/__tests__', 'node_modules', '.next', 'dist'],
  settings: {
    react: {
      version: 'detect',
    },
  },
};

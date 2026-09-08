import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['node_modules/**'] },
  {
    files: ['server.js', 'src/**/*.js', 'test/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-constant-binary-expression': 'error',
      'no-unreachable': 'error',
    },
  },
]

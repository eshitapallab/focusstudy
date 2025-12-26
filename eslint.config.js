const js = require('@eslint/js')
const globals = require('globals')
const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const nextPlugin = require('@next/eslint-plugin-next')

const nextRules =
  (nextPlugin.configs && nextPlugin.configs['core-web-vitals'] && nextPlugin.configs['core-web-vitals'].rules) ||
  (nextPlugin.configs && nextPlugin.configs.recommended && nextPlugin.configs.recommended.rules) ||
  {}

module.exports = [
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/out/**',
      '**/dist/**',
      '**/coverage/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      ...(tsPlugin.configs && tsPlugin.configs.recommended ? tsPlugin.configs.recommended.rules : {}),
      ...(react.configs && react.configs.recommended ? react.configs.recommended.rules : {}),
      ...(reactHooks.configs && reactHooks.configs.recommended ? reactHooks.configs.recommended.rules : {}),
      ...nextRules,

      // React 17+/Next.js uses the automatic JSX runtime; React doesn't need to be in scope.
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Next.js supports <style jsx> and <style jsx global>.
      'react/no-unknown-property': ['error', { ignore: ['jsx', 'global'] }],

      // Too noisy for this repo today; keep as a warning.
      'react/no-unescaped-entities': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',

      // TypeScript handles undefined identifier checks (and otherwise `no-undef` misfires on TS types).
      'no-undef': 'off',

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
]

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import jestPlugin from 'eslint-plugin-jest';
import prettierConfig from 'eslint-config-prettier';

const compat = new FlatCompat({
  baseDirectory: import.meta.url,
  resolvePluginsRelativeTo: import.meta.url,
});

export default [
  js.configs.recommended,

  // Prettier configuration
  prettierConfig,

  // Common settings
  {
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        performance: 'readonly',
      },
      ecmaVersion: 2020,
    },
  },

  // TypeScript and plugin settings
  {
    files: ['**/*.ts', '**/*.mts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
    },
  },

  // Jest settings
  {
    files: ['**/*.test.js', '**/*.test.ts'],
    languageOptions: {
      globals: {
        jest: 'readonly',
      },
    },
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      'jest/no-focused-tests': 'off',
    },
  },

  // Ignored files
  {
    ignores: ['node_modules/**', 'dist/**', '__tests__/*', '**.js', '**.mjs'],
  },
];

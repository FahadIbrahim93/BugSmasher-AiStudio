// ESLint config — validated at runtime by ESLint, not TypeScript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Global ignore patterns (not subject to any rule)
  {
    ignores: [
      'dist/',
      'build/',
      'coverage/',
      'node_modules/',
      'functions/lib/',
      'functions/node_modules/',
      '.firebase/',
      '.agents/', // agent skill files are tooling, not app source — not in the tsconfig project
      'functions/', // separate package with its own tsconfig/build — not resolvable by the root project service
      '*.config.*', // vite/ts configs are not part of the app source
      'e2e/', // Playwright tests have their own config
    ],
  },
  // Base JS/TS recommended rules
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // server.ts and all root .ts/.tsx files are part of the root tsconfig project,
          // so listing them here would create an allowDefaultProject conflict. Only
          // keep the globs for module types that are NOT in the project.
          allowDefaultProject: ['*.mjs', '*.cjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // React plugin configuration
  {
    ...reactPlugin.configs.flat?.recommended,
    settings: {
      react: {
        version: '19.0',
      },
    },
  },
  {
    ...reactPlugin.configs.flat?.['jsx-runtime'],
    settings: {
      react: {
        version: '19.0',
      },
    },
  },
  // React hooks
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },
  // JSX accessibility
  jsxA11y.flatConfigs.recommended,
  // Prettier integration — must be last to disable conflicting rules
  eslintConfigPrettier,
  // Project-specific overrides and relaxed rules
  {
    rules: {
      // Allow console for now during development
      'no-console': 'warn',
      // Allow any in some places for flexibility
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow non-null assertions cautiously
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Allow require-style imports in some cases
      '@typescript-eslint/no-require-imports': 'warn',
      // Relax unsafe assignment for gradual migration
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // Allow unbound methods for class-based game engine callbacks
      '@typescript-eslint/unbound-method': 'warn',
      // Allow await inside loops for audio/particle generation
      '@typescript-eslint/no-loop-func': 'warn',
      // Allow deprecated usage during migration
      '@typescript-eslint/no-deprecated': 'warn',
      // Restrictive rules that improve code quality
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      'react/jsx-no-target-blank': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // Allow utility classes with only static methods (e.g. ChecksumSystem)
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  // Test file overrides — relax some strictness
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/__tests__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'no-console': 'off',
    },
  },
);

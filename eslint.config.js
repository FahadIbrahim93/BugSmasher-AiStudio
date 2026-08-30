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
      // Console policy: warn/error are the sanctioned diagnostic channels in
      // the browser build; log/info/debug are disallowed (use warn/error or
      // remove). CLI scripts and the server entrypoint are exempt below.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
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
      // Numbers interpolate deterministically and losslessly; keeping
      // any/boolean/nullish interpolation strict is what catches real bugs.
      '@typescript-eslint/restrict-template-expressions': [
        'warn',
        {
          allowNumber: true,
          allowAny: false,
          allowBoolean: false,
          allowNullish: false,
          allowRegExp: false,
        },
      ],
      'react/jsx-no-target-blank': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // Allow utility classes with only static methods (e.g. ChecksumSystem)
      '@typescript-eslint/no-extraneous-class': 'off',
      // `_`-prefixed identifiers are intentionally-unused by project convention
      // (TypeScript's noUnusedLocals/noUnusedParameters already ignore them)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // React Compiler-specific rules: this codebase is NOT compiled with the
      // React Compiler, so these engine-oriented rules fire on deliberate legacy
      // patterns (store sync in effects, render-time animation clock reads,
      // singleton mutation in event handlers, ref reads for one-shot menus).
      // Keep them visible as warnings for new code; fix the real issues, not
      // compiler-optimization hints. See docs/AGENTIC_WORKFLOW.md.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  // TS files: the base no-unused-vars rule cannot understand parameter
  // properties (`constructor(protected engine)`), type-annotation params, or
  // decorators — @typescript-eslint/no-unused-vars handles all TS constructs
  // and is configured above, so turn the base rule off for TS sources.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
  // CLI tooling and the server entrypoint write to stdout/stderr by design.
  {
    files: ['scripts/**', 'server.ts'],
    rules: {
      'no-console': 'off',
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

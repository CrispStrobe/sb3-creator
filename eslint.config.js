import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `reference/extensions/*` are pinned third-party extension sources (github.com/CrispStrobe/
  // extensions), read verbatim at runtime by the vm test + registry generator — not our code to lint.
  //
  // `test/fixtures/downstream/*` are the same idea one step further out: verbatim snapshots of
  // the extension copies brickwright-lite and the extensions repo ship, vendored so the
  // conformance gate can run in CI instead of skipping (scripts/vendor-downstream-extensions.mjs).
  // They must stay byte-identical to their upstream — the gate checks their sha256 — so linting
  // or reformatting them is precisely what we do not want. lite's copies are CommonJS
  // (`require`/`module.exports`), the gallery's are browser IIFEs taking a global `Scratch`.
  //
  // `siblings/**` is where .github/workflows/ci.yml checks bw-board and bw-circuit-ui out,
  // INSIDE this workspace, so the cross-repo gates RUN instead of skipping. That puts 5.3 MB
  // of two other repositories under `eslint .`, which lints the whole tree from its root:
  // 460 problems, 451 of them errors, in code this repo does not own and cannot fix here.
  // Their lint is their repo's job, and reformatting a pinned checkout would break the very
  // revision it is pinned to.
  //
  // It took until 2026-08-23 to see because ONE commit (90391a6) introduced both defects: the
  // checkout step above had been failing on an abbreviated SHA, so `siblings/` stayed empty
  // and lint had nothing to walk into. A green Lint meant the siblings were MISSING. Repairing
  // the first defect is what exposed the second.
  globalIgnores(['dist', 'siblings/**', 'test/browser/harness.bundle.js', 'reference/**',
    'test/fixtures/downstream/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Intentional zero-width space inside a JSDoc example (it keeps a `*/`
      // in the prose from closing the block comment) — allow it in comments.
      'no-irregular-whitespace': ['error', { skipComments: true }],
    },
  },
])

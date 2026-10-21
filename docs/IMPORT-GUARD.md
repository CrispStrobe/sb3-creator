# Relative import guard

`scripts/check-staged-imports.mjs` checks the index by default and tracked files
with `--tracked`. Relative imports must resolve to a tracked path using the
existing literal, extension and directory candidates. A file merely present on
disk does not satisfy the check.

The guard uses the existing ESLint parser with inline configuration and JSX
support and disables inline configuration from inspected source. A fixture or
module comment cannot turn off dependency collection. It reads import declarations, reexports and literal dynamic imports
from syntax nodes, including executable template and JSX interpolations. Raw
fixture strings, template text, comments and regexp are not module source.
Side-effect imports and constant template dynamic imports are included. Unknown
dynamic expressions remain outside this literal dependency check. Parse errors
fail inspection; the source is neither transformed nor executed.

`test/staged-relative-imports.test.mjs` covers these boundaries and real missing
imports. The focused module and the full tracked guard require qualification;
source review alone does not establish a clean clone or hosted build result.
No dependency pins, expected results or existing test assertions are changed.

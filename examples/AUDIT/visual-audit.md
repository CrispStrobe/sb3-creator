# Visual/UX audit ledger

Parse-level visual audit of all 201 gallery examples. Each program.bw is
parsed through SB3Creator and checked for lines the parser skips (which
would appear as missing blocks in the app).

**Method:** `node test/browser/visual-audit.mjs` — parses every program.bw,
counts blocks/scripts/warnings, flags examples where the parser skips lines.

## Summary (after case-insensitive parser fix, 6b79fde)

| verdict | count | description |
|---|---|---|
| visual-pass | 199 | parse produces blocks (or comment-only pure circuit) |
| content-bug | 2 | eater6502 assembly programs — no Scratch blocks by design |
| app-bug | 0 | |
| **total** | **201** | |

The case-insensitive block-opener fix (sb3Creator.js 6b79fde) resolved 47 of
the original 49 content-bugs. All Arduino CC0 ported examples now parse into
blocks.

## content-bug (2 remaining)

| example | reason |
|---|---|
| eater6502-bench | assembly-level program, no pseudocode blocks by design |
| eater6502-vdp-hello | assembly-level program, no pseudocode blocks by design |

These are 6502 machine-code examples. They have `program.bw` files with
assembly directives that the Scratch block parser cannot represent. This is
by design, not a parser defect.

## visual-pass with residual warnings (5 examples)

These produce blocks (visual-pass) but have non-zero warnings from vocabulary
gaps — constructs the parser recognizes but cannot fully lower:

| example | warns | blocks | likely gap |
|---|---|---|---|
| arduino-05-arrays | 7 | 10 | array indexing syntax |
| arduino-07-bar-graph | 20 | 7 | for-loop with array access |
| arduino-sk-p06-light-theremin | 4 | 18 | constrain() / calibration |
| arduino-sk-p08-hourglass | 6 | 17 | millis() / timing helpers |
| arduino-sk-p11-crystal-ball | 9 | 8 | LCD library calls |

These are vocabulary gaps in the pseudocode dialect, not parser bugs. The
programs produce partial block representations. The gaps are for the campaign
agent to close by extending the dialect.

## History

- **2026-08-15 (initial):** 152 visual-pass, 49 content-bug. All 49 were
  Arduino CC0 ported examples with lowercase `if`/`else`/`for`/`while` that
  the case-sensitive parser skipped.
- **2026-08-15 (after 6b79fde):** 199 visual-pass, 2 content-bug. Parser
  fix resolved 47 bugs. The remaining 2 are assembly programs by design.

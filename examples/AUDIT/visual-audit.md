# Visual/UX audit ledger

Parse-level visual audit of all 201 gallery examples. Each program.bw is
parsed through SB3Creator and checked for lines the parser skips (which
would appear as missing blocks in the app).

**Method:** `node test/browser/visual-audit.mjs` — parses every program.bw,
counts blocks/scripts/warnings, flags examples where the parser skips lines.

## Summary

| verdict | count | description |
|---|---|---|
| visual-pass | 152 | parse clean, all lines become blocks (or comment-only) |
| content-bug | 49 | parser skips lines — blocks won't render in the app |
| app-bug | 0 | |
| **total** | **201** | |

The 49 content-bugs are ALL Arduino CC0 ported examples (arduino-* and
eater6502-bench/vdp-hello). These use pseudocode constructs the parser
doesn't handle yet (porting in progress by the campaign agent). The original
gallery (01-54, pc01-pc62, avr01-06, nano/mega/pico, blinkenrocket, z80)
is 100% visual-pass.

## content-bug details (49 examples)

All are parser-skip issues — the pseudocode uses constructs not yet lowered:

| example | skipped lines | likely cause |
|---|---|---|
| arduino-01-blink | 4 | |
| arduino-01-analog-read-serial | 2 | |
| arduino-01-digital-read-serial | 2 | |
| arduino-01-fade | 5 | |
| arduino-01-read-analog-voltage | 4 | |
| arduino-02-blink-without-delay | 8 | |
| arduino-02-button | 4 | |
| arduino-02-debounce | 14 | |
| arduino-02-digital-input-pullup | 7 | |
| arduino-02-state-change | 11 | |
| arduino-02-tone-keyboard | 8 | |
| arduino-02-tone-multiple | 9 | |
| arduino-02-tone-pitch-follower | 5 | |
| arduino-03-analog-in-out-serial | 5 | |
| arduino-03-analog-input | 5 | |
| arduino-03-analog-write-mega | 8 | |
| arduino-03-calibration | 14 | |
| arduino-03-fading | 10 | |
| arduino-03-smoothing | 10 | |
| arduino-04-dimmer | 3 | |
| arduino-04-read-ascii-string | 4 | |
| arduino-04-serial-call-response | 4 | |
| arduino-04-serial-passthrough | 2 | |
| arduino-05-arrays | 8 | |
| arduino-05-for-loop | 36 | |
| arduino-05-if-statement | 7 | |
| arduino-05-switch-case | 11 | |
| arduino-05-switch-case-2 | 15 | |
| arduino-05-while-statement | 13 | |
| arduino-06-knock | 10 | |
| arduino-06-ping | 7 | |
| arduino-07-bar-graph | 22 | |
| arduino-07-row-column-scanning | 5 | |
| arduino-sk-p02-spaceship | 12 | |
| arduino-sk-p03-love-o-meter | 21 | |
| arduino-sk-p04-color-mixing | 4 | |
| arduino-sk-p05-servo-mood | 3 | |
| arduino-sk-p06-light-theremin | 10 | |
| arduino-sk-p07-keyboard | 11 | |
| arduino-sk-p08-hourglass | 17 | |
| arduino-sk-p09-motorized-pinwheel | 4 | |
| arduino-sk-p10-zoetrope | 14 | |
| arduino-sk-p11-crystal-ball | 5 | |
| arduino-sk-p12-knock-lock | 21 | |
| arduino-sk-p13-touch-lamp | 10 | |
| arduino-sk-p14-serial-pot | 2 | |
| arduino-sk-p15-hacking-buttons | 4 | |
| eater6502-bench | 0 (no blocks from non-empty) | assembly-level program |
| eater6502-vdp-hello | 0 (no blocks from non-empty) | assembly-level program |

## visual-pass highlights

- **Zero-warning examples** (original gallery): 01-54, pc01-pc62, avr01-06,
  nano/mega/pico, blinkenrocket, eater6502-blink, z80-bench — all parse
  with 0 warnings and produce the expected block count.
- **arduino-02-tone-melody**: the ONLY Arduino ported example that parses
  clean (0 warnings, 18 blocks).
- **arduino-08-* (string series)**: all 14 parse clean (0 warnings each).
- **arduino-04-ascii-table**: parses clean (0 warnings).
- **blinkenrocket-pendant**: 41 blocks, 1 script, 0 warnings despite 58
  parse warnings in the engine audit — the visual audit uses the current
  parser which has been updated since.

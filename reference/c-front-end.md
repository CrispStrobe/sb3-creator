# The C front end — C → pseudocode (`cToPseudocode.js`)

The fourth front end, alongside `pythonToPseudocode.js` and `javascriptToPseudocode.js`.
It reads C and produces Brickwright pseudocode, making the C target two-way.

## What it does

Two inputs, with different strategies:

| input | strategy | fidelity |
|---|---|---|
| **Our own output** (`generateC`) | the `@bw` marker header carries device, pins, variable names, proccodes, script boundaries | exact round-trip; `pseudocode → C → pseudocode` is a fixed point, zero warnings |
| **Hand-written firmware** | everything inferred from the source: pins from `#define`/`sbit`, polarity from the `LED_ON 0` idiom, clock from `FOSC_HZ`, directions from usage | best effort; **every inference is reported in `warnings`** |

The cooperative-scheduler form (multiple `WHEN flag clicked:` scripts compiled to Duff's-device
state machines) is structurally inverted. The shapes are finite — `cTaskBlock` in `sb3Creator.js`
is the complete grammar — and each shape is recognised by structure, never by regex.

## What it handles

### Constructs (each driven by corpus failure forensics)

| C construct | pseudocode | notes |
|---|---|---|
| `for (;;)` | `FOREVER:` | |
| `while (1)` | `FOREVER:` | |
| `for (i = 0; i < N; i++)` | `REPEAT N:` | also handles typed inits (`uint8_t i`), `!=`, `<=`, count-down, start > 0 |
| `while (cond)` | `REPEAT UNTIL not cond:` | |
| `do { } while (cond)` | `REPEAT UNTIL not cond:` | |
| `if` / `if-else` | `IF cond THEN:` / `ELSE:` | |
| `switch / case` | series of `IF val = N THEN:` blocks | approximate; `default` attaches as `ELSE` to last case |
| `x & y`, `x \| y`, `x ^ y`, `~x`, `x << n`, `x >> n` | `bitand`, `bitor`, `bitxor`, `bitnot`, `shiftleft`, `shiftright` | SFR register setup stays silently filtered |
| `x &= y`, `x \|= y`, `x ^= y`, `x <<= n`, `x >>= n` | `set x to x bitand y` etc. | on non-SFR variables only |
| `x = cond ? a : b` | `IF cond THEN: set x to a ELSE: set x to b` | assignment-form only; ternary inside call args warns |
| `break` at loop end | folds into `REPEAT UNTIL cond:` | exact, no warning |
| `break` mid-loop | flag variable `_brkN` + `IF _brkN = 0 THEN:` guard | warned: "the program structure changed" |
| `continue` | skipped with warning | |
| `P1_0 = expr` (pin write) | `set pin to expr` or `turn on/off` | computed values are levels (no polarity inversion) |
| `delay_ms(N)` | `wait N/1000 seconds` | also `Delay_ms`, `delayms`, `delay` |
| user function calls | custom-block call syntax | hand-written firmware only |
| `sbit LED = P1^0;` | pin declaration | |
| `__sbit __at (0x90) LED;` | pin declaration | SDCC form, from keil2sdcc preprocessing |
| `(char *)x`, `(uint8_t)x` | cast skipped | common typedefs recognised |
| `a ? b : c` (in expressions) | `b` with warning | else branch consumed but dropped |
| `x[i]`, `s.field`, `s->field` | parsed, value opaque | prevents parser crash on array/struct access |
| `&x`, `*x`, `++x`, `x++` | parsed | address-of, dereference, pre/post increment |
| `goto` | **refused** | genuinely inexpressible in structured blocks |

### Cooperative-scheduler inversion

The Duff's-device state machines from multi-script projects are recognised by structure:

| construct | C pattern |
|---|---|
| FOREVER | `state = S; case S: <body> state = S; return;` |
| REPEAT n | `bw_iK = (expr); state = S; case S: if (bw_iK) { … bw_iK--; state = S; return; }` |
| REPEAT UNTIL c | `state = S; case S: if (!(c)) { … state = S; return; }` |
| wait N seconds | `until = bw_now() + (MS); state = S; case S: if ((int)(…) < 0) return;` |
| wait until c | `state = S; case S: if (!(c)) return;` |
| stop | `state = 0xFFFF; return;` |

Case labels inside `if`/`else` branches (the Duff's-device property) are handled correctly.
Proc parameter names are recovered from the C function signature.

### Script comments

`//` comments placed by the emitter before function definitions are recovered as `# comment`
lines before the `WHEN flag clicked:` hat. Single-script comments inside `main()` (after
`bw_setup()`) are also recovered. This closes the device C round-trip for comments.

### Known emitter limitation

In multi-script programs, the emitter only places `//` comments before the **first** task
function. Comments on the second and subsequent scripts are lost by `generateC`, not by
the reader. The round-trip is consistent (a fixed point) because neither hop has the comment.

## Open defects (6, characterised 2026-08-09)

| # | file | construct | class | fixable? |
|---|---|---|---|---|
| 1 | `带闹钟…时钟.c` | `if(UpdateTimeFlag=1)` — assignment in condition | **source bug** | no — `=` not `==` |
| 2 | `WaveForm_Rom.c` | `if((fp = fopen(…)))` — assignment in condition, file I/O | **out of scope** | desktop utility, not firmware |
| 3 | `WaveForm_Rom.c.gbk.c` | same as #2, GBK re-encoding | **duplicate** | — |
| 4 | `串口控制/main.c` | `for(i=0; buzzc[i]!='\0'; i++)` — string-scanning loop | **dialect gap** | needs array/string dialect (tier 2) |
| 5 | `寻址/IIC.c` | `lcdshow(0,0,(a==0?"y":"n"),1)` — ternary in call argument | **honest warning** | would need temp-variable hoisting |
| 6 | `高精度PWM/main.c` | `SetMotoangle(SWdir?angle++:angle--)` — ternary with side effects | **honest warning** | restructuring would be fragile |

Defects 1–3 are not translator bugs: 1 is broken C, 2–3 are desktop utilities.
Defect 4 is blocked on the array/lookup-table dialect (tier 2 in `DIALECT-COVERAGE.md`).
Defects 5–6 are correctly warned; the translator refuses rather than guessing.

## Corpus results

**Measured 2026-08-09** against 1282 `.c` files from 76 STC12/8051 repositories
(9 of 85 failed to clone — link rot). Corpus lives in `corpus/` (gitignored, never committed).

```bash
# Reproduce:
node scripts/corpus-baseline.mjs          # basic pass/warn/fail
node scripts/corpus-keil-effect.mjs       # with keil2sdcc preprocessing
```

### Four-category split (515 files with `main()`, 767 library files excluded)

| | count | % of 515 |
|---|---|---|
| 1. Translates directly (zero real warnings) | **502** | **96.4%** |
| 2. Translates after restructuring (break→flag, warned) | 10 | 1.9% |
| **total that translate** | **512** | **98.3%** |
| 3. Remaining defects (characterised above) | 6 | 1.2% |
| 4. Genuinely impossible (`goto`) | 3 | 0.6% |

### Trajectory

| date | direct | total | exceptions | what changed |
|---|---|---|---|---|
| baseline (before any work) | — | — | 46 | — |
| after Phase 2 broadening | 426 / 515 (82.7%) | 426 | 0 | arrays, do/while, switch, casts, for-loops, _nop_ |
| + bitwise dialect | 468 / 515 (90.9%) | 468 | 0 | `bitand`/`bitor`/`bitxor`/`bitnot`/`shiftleft`/`shiftright` |
| + break/continue | 468 | 476 (92.4%) | 0 | flag variable transformation |
| + pin computed value | 494 / 515 (95.9%) | 504 (97.9%) | 0 | `set <pin> to <expr>` dialect |
| + for-loop patterns + uchar casts | 494 | 504 | 0 | typed inits, `!=`, count-down |
| + comment stripping + ternary expansion | 502 / 515 (96.4%) | 512 (98.3%) | 0 | string-aware `//`, `x = c ? a : b` |

### keil2sdcc effect (measured separately)

keil2sdcc (`stc-compiler/keil2sdcc.py`) preprocesses Keil C51 dialect into SDCC form. It
changed 494 corpus files. Effect on translation: **+16 clean files** on top of bitwise (was
+1 before the bitwise dialect — the two interact because keil2sdcc translates Keil-style
bitwise SFR setup that is now expressible). This is **input widening** (more files parse as
valid C), not expressibility (constructs the dialect can represent).

## Relation to the host C front end

The host C target (`generateC` for non-pin projects) uses `cHostRuntime.js` and a different
reader (`cHostToPseudocode.js`). The two readers are separate modules because they solve
different problems: device C reads SFR setup, pin idioms, and Duff's-device schedulers; host
C reads `bw_val`/`scratch_*` patterns and Scratch's value model. They share the tokenizer
(`tokenize`, `Cursor`, `ExprParser`) but not the statement-level walkers.

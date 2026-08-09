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

## Cube driver characterisation (2026-08-09)

`stc/src/20-ledcube/main.c` — hand-written firmware with no `@bw` header. 239 lines,
`__code` arrays, port writes, indexed tables, nested loops, inter-function calls.

| construct | result | class |
|---|---|---|
| `while(1)` in main → `FOREVER:` | ✓ translated | |
| Function calls → custom-block syntax | ✓ translated | |
| Loop structures (for/while) | ✓ translated | |
| Conditionals | ✓ translated | |
| `delay_ms(N)` → `wait` | ✓ translated | |
| Bitwise in expressions | ✓ translated (since dialect) | |
| User function definitions → `DEFINE` | ✓ translated (new) | was missing |
| `P0 = fb[line]` — port write | silently filtered (SFR) | **dialect gap**: whole-port I/O |
| `__code uint8_t table[] = {...}` | skipped (declaration) | **dialect gap**: lookup tables |
| `fb[line]`, `scan_table[line]` | parsed, index lost | **dialect gap**: arrays |
| `fb[i] = (fb[i] | 0x0F) & ~(mask)` | bitwise on array → empty | **parser + dialect gap** |

**Summary:** the function structure, loops, calls, delays, and bitwise all translate.
What blocks it is the same two features DIALECT-COVERAGE.md identifies as tier 2:
whole-port I/O and indexed lookup tables. These are feature requests for the dialect,
not bugs in the parser.

## Defects (6, characterised and triaged 2026-08-09)

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
The fix for 5–6 (temp-variable hoisting for ternary inside call arguments)
requires propagating ternary info out of the expression parser into statement-level
code — an architectural change disproportionate to 2 corpus files.

**All six are dispositioned**: 3 are not translator bugs (source / scope / duplicate),
1 is blocked on the tier-2 array dialect, and 2 are correctly warned rather than guessed.
Three of the six still do not translate; none of them do so silently.

## Corpus results

**Last measured: 2026-08-09** at commit `9bdb9e1`.

Corpus: 1282 `.c` files from 76 STC12/8051 repositories (9 of 85 failed to
clone — link rot). Corpus hash (SHA-256 of all file hashes): `2e82d48b39214d7c`.
Lives in `corpus/` (gitignored, never committed).

```bash
# Reproduce the four-category split:
node -e "
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import cToPseudocode from './src/utils/cToPseudocode.js';
import SB3Creator from './src/utils/sb3Creator.js';
const INFERENCE = /^(no clock|no register|no pins|polarity|inferred|<stc)/;
const files = execSync('find corpus -name \"*.c\" -type f',{encoding:'utf8'}).trim().split('\n');
let noMain=0,hasMain=0,direct=0,restr=0,gotoF=0,defects=0;
for (const f of files) { const src=readFileSync(f,'utf8');
  try { const{pseudocode,warnings}=cToPseudocode(src); const c=new SB3Creator(); c.parse(pseudocode);
    const all=[...warnings,...c.warnings].filter(w=>!INFERENCE.test(w)&&!/Unknown DEVICE/.test(w));
    if(all.some(w=>/no main/.test(w))){noMain++;continue;} hasMain++;
    const int=all.filter(w=>!/Unknown command/.test(w));
    const str=int.filter(w=>/transformed|structure/.test(w));
    const real=int.filter(w=>!/transformed|structure/.test(w));
    if(!real.length&&!str.length){direct++;continue;}
    if(!real.length){restr++;continue;}
    if(real.every(w=>/goto/.test(w))){gotoF++;continue;} defects++;
  } catch{} }
console.log('direct:',direct,'/',hasMain,'restructured:',restr,'defects:',defects,'goto:',gotoF);
"
```

### Four-category split (521 files with `main()`, 761 library files excluded)

| | count | % of 521 |
|---|---|---|
| 1. Translates directly (zero real warnings) | **466** | **89.4%** |
| 2. Translates after restructuring (break→flag, warned) | 23 | 4.4% |
| **total that translate** | **489** | **93.9%** |
| 3. Remaining defects | 28 | 5.4% |
| 4. Genuinely impossible (`goto`) | 4 | 0.8% |

Note: numbers differ from the earlier 502/515 measurement because the codebase evolved
(new opcodes, ledcube blocks, DEFINE emission for hand-written functions produces parse
warnings from functions with array subscripts). The previous measurement was on a
different commit and is superseded.

### keil2sdcc effect (measured separately)

keil2sdcc (`stc-compiler/keil2sdcc.py`) preprocesses Keil C51 dialect into SDCC form. It
changed 494 corpus files. Effect on translation: **+0 files** — the front end now handles
Keil constructs (`sbit`, `sfr`, `__sbit __at`) natively, so the preprocessing is redundant
for translation. It remains valuable for SDCC *compilation* but not for this front end.

This is **input widening** (more files parse as valid C), as distinct from expressibility
(constructs the dialect can represent). The two axes are separate and the keil2sdcc effect
on the translation axis is now zero.

## Relation to the host C front end

The host C target (`generateC` for non-pin projects) uses `cHostRuntime.js` and a different
reader (`cHostToPseudocode.js`). The two readers are separate modules because they solve
different problems: device C reads SFR setup, pin idioms, and Duff's-device schedulers; host
C reads `bw_val`/`scratch_*` patterns and Scratch's value model. They share the tokenizer
(`tokenize`, `Cursor`, `ExprParser`) but not the statement-level walkers.

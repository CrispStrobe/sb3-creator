# The C target — blocks → C for the STC12 / 8051

`SB3Creator.generateC(project, opts)` is the fifth code target, beside `decompile`
(pseudocode), `generatePython` and `generateJavaScript`. It compiles a Brickwright project to
C for an **STC12C5A60S2** and its relatives, ready for SDCC.

**C is two-way as of 2026-08-08** — `src/utils/cToPseudocode.js` is the fourth front end,
alongside `pythonToPseudocode.js` and `javascriptToPseudocode.js`. It reads two kinds of C:

| input | how the facts are obtained | fidelity |
|---|---|---|
| **our own output** | the `@bw` marker header `generateC` emits | exact; `C → pseudocode → C` is a fixed point, zero warnings |
| **hand-written firmware** | inferred — pins from `#define LED1 P1_0` / `sbit LED1 = P1^0;`, polarity from the `LED_ON 0` idiom, clock from `#define FOSC_HZ`, direction from use | best effort; **every inference is reported in `warnings`** |

**Why the marker header.** `#include <stc12.h>` cannot distinguish a stc12c5a60s2 from a
stc15f2k60s2; `cName` mangling is not reversible; a proccode's `%s`/`%b` positions vanish into
the C function name; and the Duff's-device form hides where one script ends and the next
begins. So the emitter states them, exactly as `scratch.defblock(…)` / `scratch.sprite(…)`
already do for Python and JS. Suppress with `{markers: false}` if you only want the C.

The register prologue also moved out of `main()` into `bw_setup()`, so a reader can tell setup
from program without heuristics — `P1_0 = 1; /* led off */` in the prologue is otherwise
indistinguishable from a real statement.

**Polarity is the pleasing one.** `#define LED_ON 0` together with `LED1 = LED_ON;` *is*
active-low wiring, so a real `board.h` already states the polarity without meaning to. Two
traps, both now covered by tests: reading only the **first** write inverts it, because a
`board_init()` that parks the LED with `LED1 = LED_OFF;` runs before any `= LED_ON`; and a pin
is often written only one of the pair, so `X = SOMETHING_OFF` that is `1` has to settle it
symmetrically.

**What it will not do.** The cooperative-scheduler form is **not inverted**. Recovering three
scripts from a switch whose `case` labels are scattered through nested `if`s is a genuine
inverse problem, and a fragile half-inverter would be worse than saying so — it warns and
tells you to re-generate from blocks. Bitwise work, `do`/`switch`/`goto`, and anything else
outside the subset is dropped with a warning rather than mistranslated.

For that reason C stays **out of the strict two-way convergence invariant** the other three
languages satisfy: it is genuinely two-way over the subset it covers, not over all of it.

## What the other two pieces in `../stc-compiler` contribute

Neither is on the C → blocks path, which is why neither was ever a substitute for the front
end above:

| have | what it really is | measured |
|---|---|---|
| `keil2sdcc.py` — `POST /translate`, `/translate-project` | **C → C.** Dialect normalisation, so it widens the *input surface* of the front end above: a Keil project can now become blocks by passing through both. | 546/597 files over an 86-repo corpus (91%); 31/31 on the hand-converted QX-mini51 parallel corpus |
| `stc_disasm.py` — `POST /disassemble` | **HEX → asm.** A *different and harder* front end: asm → pseudocode needs structure recovery. Its own track, below. | 380/380 byte-exact over 349 images, verified two ways |

### The asm → blocks track, separately

Three strategies, increasing in ambition; do them in this order.

1. **Our own images: idiom matching, not decompilation.** The shape is known — `delay_ms`,
   `bw_now`, `adc_read` are recognisable subroutines, SFR bit writes are `CLR`/`SETB` on a
   known bit address, and every loop is one of a finite set of skeletons `stmts_c` can
   produce. Find the library routines by byte signature (the technique IDA's FLIRT uses),
   then match the remaining basic blocks against that finite set. The oracle is free:
   `generateC → SDCC → hex → disassemble → recover → compare against the original
   pseudocode`, in the same spirit as the existing reassembly round-trip.
2. **Foreign images: annotate rather than decompile.** For a third-party `.hex` the useful
   product is usually a named, commented disassembly plus a recognised-peripheral report
   ("writes `ADC_CONTR` with `0xE8|ch` then polls bit 4 → an ADC read on channel *n*";
   "Timer 0 mode 1, reload 0xDC00 at FOSC/12 → a 1 ms tick"). Achievable from what already
   exists, and it is what the debugger view wants anyway.
3. **Real structure recovery, only if a need appears — and adopted, not hand-rolled.** Build
   a CFG from the existing linear sweep (its branch-target sync points already give the
   leaders), then structural/interval analysis to recover `if`/`while` (Cifuentes' *dcc* is
   the canonical reference at this scale; `reko`, `retdec` and Ghidra's decompiler all
   descend from it). Control flow is the *easy* half on an 8051 — compilers emit very
   stereotyped code. The pain is data: `ACC`/`B`/`DPTR`/`R0–R7` with register banks
   (`PSW.RS0/RS1`), bit-addressable RAM at 0x20–0x2F, four address spaces, and SDCC passing
   arguments in registers while overlaying locals. Type recovery is where decompilers lose.

**The emulator is the test harness for all three.** With an STC12 model in ucsim, a recovered
program can be validated by *executing* both and comparing pin/SFR traces — differential
execution as the oracle for decompilation, the same pattern already used for the Keil
translator. So the ucsim work is not a detour from the reverse direction; it is what makes it
checkable.

## The reference implementation and oracle

`stc_pseudocode.py` in **CrispStrobe/stc-compiler** (public, live at
<https://stc-compiler.vercel.app>) holds `parse` / `emit_pseudocode` / `emit_c` over the same
AST shape this repo uses for blocks — literally the same design, one language over.
`cStackBlock` ports its `stmts_c`, `cTaskBlock` its `stmts_task`, `generateC` its `emit_c`.

The oracle costs nothing to run: for an equivalent program, blocks → C here and pseudocode → C
there agree, and either way `POST /compile {"language":"c"}` proves it builds.

```bash
STC_COMPILER_URL=https://stc-compiler.vercel.app node --test test/ctarget.test.mjs
```

Without the env var those four checks skip, so the fast suite stays offline.

## The block surface

Four top-level declarations and four statements, spelled exactly as in stc-compiler's
pseudocode dialect (see `stc12c5a60s2-lab/pseudocode/*.bw`). They live on `project.stc`
(`{device, clock, pins}`), so they survive pseudocode ⇄ blocks and ride along in project.json.

```
DEVICE STC12C5A60S2                       # stc12c5a60s2 | stc12c5a16s2 | stc89c52(rc) | stc15f2k60s2
CLOCK 11059200                            # or: CLOCK 12 MHz
PIN led1 = P1.0 OUTPUT ACTIVE LOW
PIN pot  = P1.3 ANALOG                    # ADC channel n is physically P1.n
PIN btn  = P3.2 INPUT

WHEN flag clicked:
  turn on led1                            # -> stc12_setpin  (polarity-aware)
  turn off led1
  set led1 high                           # -> stc12_setpin  (a level, polarity ignored)
  toggle led1                             # -> stc12_toggle
  set reading to read pot                 # -> stc12_read    (reporter; also usable as a condition)
```

A pin statement only claims a line when the name really is a declared `PIN`, so `turn right 15
degrees` and `set x to 0` keep their ordinary Scratch meanings.

Everything else is the standard block set: `FOREVER`, `REPEAT n`, `REPEAT UNTIL`, `IF/ELSE`,
`wait n seconds`, `wait until`, `stop`, variables, custom blocks, and arithmetic. Blocks with
no meaning on bare metal (motion, looks, sound, lists) become `/* comments */` and a warning —
the same treatment the Python back end gives them as `#` lines.

## The three settled decisions (copied, not re-derived)

1. **Scheduling.** Several `when green flag clicked` scripts compile to a **cooperative
   scheduler**: a Timer-0 ISR advances a millisecond counter and does nothing else, and each
   script becomes a Duff's-device state machine that yields at every wait **and at every loop
   back-edge** — Scratch's own contract, and what stops a busy `FOREVER` starving the others.
   Deadlines are wraparound-safe 16-bit compares behind an interrupt-safe read, because a
   16-bit load is not atomic on an 8051. One script keeps straight-line emission in `main()`.
   Custom blocks run to completion (as in Scratch), so a `wait` inside one really does block —
   on the tick, via `bw_block_ms`, never on a cycle count.
2. **Timing.** Everything hangs off **Timer 0 at FOSC/12**, the one mode a 12T STC89 and a 1T
   STC12/STC15 count identically, so the same project is timing-correct whichever chip it
   lands on. **Never a cycle-counted delay loop:** a 1T part runs one ~6–12× too fast, which
   is the classic drop-in-socket bug. `SB3Creator.STC_PARTS` knows which families have
   port-mode registers (`PxM0`/`PxM1`), the `AUXR` 1T bit, and an ADC.
3. **Active-low pins.** A quasi-bidirectional 8051 pin sinks 20 mA but sources only ~230 µA,
   so LEDs are wired active-low (+5 V → 1 kΩ → LED → pin) and `turn on` must write a **0**.
   `main()` also parks every output at its OFF level before anything runs.

## Options

```js
creator.generateC(project, {
    device: 'stc89c52rc',   // overrides DEVICE
    clock: 12000000,        // overrides CLOCK (Hz)
    pins: [...],            // overrides the declared pins
    comments: false,        // drop block comments (default: emit them as C comments)
    markers: false,         // drop the @bw header (default: emit it)
    debug: true             // a build you can debug — see below
});
```

`debug: true` does two things and nothing else. It adds a **yield map** to the `@bw` header —
`yield <task> <state> <block id> <kind>`, one line per `case` label — which is what lets a
debugger highlight the block a halted program is sitting on rather than report a number; and it
**forces the cooperative scheduler even for a single script**, because straight-line code in
`main()` has no `<task>_state` and therefore no position to report at all.

It is opt-in rather than always-on because block ids are minted afresh by every parse: emitting
them unconditionally would make the same program produce different C run to run, breaking the
`C → pseudocode → C` fixed point and making the output undiffable. Read the map back with
`readYieldMap(source)` from `cToPseudocode.js`; `stc-compiler/stc_symtab.py` merges it into
`yields[].block` beside the code address. Full design: [`debugger-ui.md`](debugger-ui.md).

Numbers are 16-bit `int`s — Scratch's integers without the float tail. Fractional literals are
truncated, and `/` is integer division, exactly as the oracle does it.

## Where this is going

Two surfaces the hardware story still needs. Neither exists yet; both are additive to
Scratch's stage rather than replacements for it, and neither requires emitter changes.

- **A hardware interaction / visualisation surface** — what
  [S4A](https://s4a.cat/index_en.html) does with its board picture, but modern and
  multi-device: LED states, pin levels, pot/sensor readings, motor speeds, live next to the
  stage. One panel, two sources: **simulated** (fed by the emulator, or by the neutral driver
  shim) and **live** (mirroring real hardware over the tethered link). It rides on the
  existing `RUNTIME_EXTENSIONS` driver contract — the panel is just another driver consumer.
  Order: LEGO hubs (drivers exist), the 8051 board, later Arduino.
- **A simulator / emulator / debugger view** — run the emitted image with nothing plugged
  in: step, breakpoints, SFR and register view, memory, pin state. **`emu8051` is the UX
  reference** (its TUI already shows the right panes); **`ucsim`/`s51` is the engine the
  toolchain already builds against** — stc-compiler uses ucsim differential execution as one
  of its three oracles. The known gap is that **no ucsim build ships an STC model** (verified
  at git head 0.9.9), so an STC12 model — the SFR set, the ADC, the PCA, the 1T timing — is
  the actual work. For the browser, ucsim or emu8051 compiled to WebAssembly is the realistic
  path.

## Known limits

- Lists, strings, `pick random`, and the trig/`mathop` reporters have no C equivalent; they
  emit `0` plus a warning rather than a guess.
- Non-flag hats (key pressed, broadcast, clone) are skipped with a warning — there is no
  event source on the chip. Tethered mode is where those belong.
- PWM (the PCA modules) and UART output are not emitted yet; the C primitives for them are
  unwritten on the hardware side too.

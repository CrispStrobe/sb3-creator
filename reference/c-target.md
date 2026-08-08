# The C target — blocks → C for the STC12 / 8051

`SB3Creator.generateC(project, opts)` is the fifth code target, beside `decompile`
(pseudocode), `generatePython` and `generateJavaScript`. It compiles a Brickwright project to
C for an **STC12C5A60S2** and its relatives, ready for SDCC.

It is **emit-only for now**: there is no C → blocks front end *yet*, so C is excluded from the
two-way convergence invariant that pseudocode/Python/JavaScript satisfy. The STC *block
surface* below does round-trip pseudocode ⇄ blocks like everything else.

**Both directions are the intent.** The keystone is one piece of work: **`cToPseudocode.js`**,
a fourth front end exactly parallel to `pythonToPseudocode.js` / `javascriptToPseudocode.js`
— tokenizer + Pratt parser → the shared `Translator` → pseudocode → `parse()`. That is what
makes C two-way; nothing else does.

Two things make it tractable, and both are established house patterns rather than new ideas:

- **Parse the subset the emitter emits, not general C.** The Python and JS front ends only
  ever parse what their emitters produce, and `generateC`'s vocabulary is far smaller and
  more regular than either: `P1_0 = 0;`, `delay_ms(150);`, `for (;;)`, `while (!(cond))`, the
  `{ unsigned int _iN; for (…) }` REPEAT idiom, `static int` variables. Round-tripping *our
  own* output is the tractable, testable goal.
- **Where the C form loses information, emit a marker.** `generatePython` already emits
  `scratch.defblock(proccode, warp)`, `scratch.sprite(…)`, `scratch.global_var(…)` for
  exactly this reason. `generateC` should emit an equivalent machine-readable header
  (DEVICE / CLOCK / PIN, and the script boundaries) so the front end never has to invert the
  Duff's-device state machine — recovering "three `when green flag clicked` scripts" from a
  switch whose `case` labels are scattered through nested `if`s is a genuine inverse problem,
  and it does not need solving if the emitter simply says so.

**What the two existing pieces in `../stc-compiler` actually contribute** — neither is on the
C → blocks path, which is why neither is a substitute for the front end above:

| have | what it really is | measured |
|---|---|---|
| `keil2sdcc.py` — `POST /translate`, `/translate-project` | **C → C.** Dialect normalisation, so it widens the *input surface* of the front end above: once `cToPseudocode` exists, a Keil project can become blocks. It moves nothing toward blocks on its own. | 546/597 files over an 86-repo corpus (91%); 31/31 on the hand-converted QX-mini51 parallel corpus |
| `stc_disasm.py` — `POST /disassemble` | **HEX → asm.** A *different and harder* front end: asm → pseudocode needs structure recovery (no loop shapes, no names, no script boundaries). Keep it on its own track. | 380/380 byte-exact over 349 images, verified two ways (SDCC's own `.rst` listing, and reassembly through `sdas8051`/`sdld`) |

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
    comments: false         // drop block comments (default: emit them as C comments)
});
```

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

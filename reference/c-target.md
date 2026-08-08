# The C target — blocks → C for the STC12 / 8051

`SB3Creator.generateC(project, opts)` is the fifth code target, beside `decompile`
(pseudocode), `generatePython` and `generateJavaScript`. It compiles a Brickwright project to
C for an **STC12C5A60S2** and its relatives, ready for SDCC.

It is **emit-only for now**: there is no C → blocks front end *yet*, so C is excluded from the
two-way convergence invariant that pseudocode/Python/JavaScript satisfy. The STC *block
surface* below does round-trip pseudocode ⇄ blocks like everything else.

**Both directions are the intent**, and most of the machinery for the way back already exists
in `../stc-compiler` — the missing piece is the lift onto pseudocode/blocks, not the ability
to read C or an image:

| have | what it does | measured |
|---|---|---|
| `keil2sdcc.py` — `POST /translate`, `/translate-project` | reads arbitrary third-party Keil C51 and normalises it to SDCC C (whole projects: ISR-prototype injection, case-unified externs, `.uvproj` source list) | 546/597 files over an 86-repo corpus (91%); 31/31 on the hand-converted QX-mini51 parallel corpus |
| `stc_disasm.py` — `POST /disassemble` | Intel HEX image → 8051 assembly, table generated from the encoding's regularities, linear sweep with branch-target sync points | 380/380 byte-exact over 349 images, verified two ways (SDCC's own `.rst` listing, and reassembly through `sdas8051`/`sdld`) |

So the reverse direction is a roadmap item with two thirds of its foundation already
measured — not a closed door.

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

## Known limits

- Lists, strings, `pick random`, and the trig/`mathop` reporters have no C equivalent; they
  emit `0` plus a warning rather than a guess.
- Non-flag hats (key pressed, broadcast, clone) are skipped with a warning — there is no
  event source on the chip. Tethered mode is where those belong.
- PWM (the PCA modules) and UART output are not emitted yet; the C primitives for them are
  unwritten on the hardware side too.

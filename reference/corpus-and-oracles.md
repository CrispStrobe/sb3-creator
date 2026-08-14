# Corpus & oracles: scaling ground truth to every device

*2026-08-13. Internal contract — English only. Owner: coordinator; lanes
assigned below.*

The 8051 got trustworthy through mass: dozens of gallery examples, golden
emissions, two independent emulators diffed against each other, hosted-compile
oracles, and round-trip fixed points. The AVR and RP2040 have deep but NARROW
proof — a handful of programs, each verified to the nanosecond. This document
is the plan for giving every device the 8051's breadth without hand-writing
hundreds of programs per chip.

## 1. The one idea everything hangs on: the canonical trace

A program's observable behaviour, device-independent:

```
trace = {
  events: [ { tMs, pin: "<logical name>", level: 0|1 } ... ],   // ON/OFF intent, polarity-normalized
  pwm:    [ { tMs, pin, percent } ... ],
  serial: [ { tMs, line } ... ],
  vars:   { name: finalValue },        // at trace end
  horizon: <tMs the trace covers>
}
```

Logical pin names and ON/OFF intent — never port bits, never polarity. An
active-low STC12 LED and an active-high Pico LED produce the SAME trace for
the same program. That is what makes every comparison below possible.

## 2. The referee: a reference trace interpreter (coordinator)

A ~small interpreter over the project's block AST implementing Scratch's own
cooperative contract — tasks yield at waits and loop back-edges, a virtual
millisecond clock, deterministic, no wall time, no device. It is deliberately
INDEPENDENT of all four backends (Python/JS/C/sb3): a fifth opinion, so a
backend bug cannot vouch for itself. (The JS backend was considered and
rejected as referee: it runs multi-WHEN programs sequentially, which is
faithful to nothing.)

Analog inputs and buttons come from a scripted stimulus timeline
(`{ tMs, pin, volts|level }`), so ADC/button programs are deterministic too.

## 3. The comparators

* **C-vs-referee** (per device): compile the program (hosted or local
  toolchain), run under the device emulator (emu8051 / avr8js / rp2040js)
  with the boundary-A adapter recording the same trace shape, normalize
  (logical names, polarity), compare with tolerance: event ORDER exact,
  event TIME within ±1 tick + drift budget, serial exact, PWM percent ±2.
* **Cross-architecture**: retarget the SAME program to every capable device;
  all traces must match the referee. One body, N devices, one truth.
* **External oracles** (independent implementations, CI/local only):
  simavr for AVR (LGPL — never vendored) speaking the same trace format;
  Renode (MIT) is the candidate second executor for RP2040 — feasibility
  note owed before adoption. ucsim remains the 8051's second opinion.
* **Round-trips stay as they are**: pseudocode ⇄ blocks ⇄ decompile fixed
  points, C → pseudocode for Arduino sketches, retarget re-parse checks.

## 4. Where hundreds of programs come from (without writing them)

1. **Retarget amplification** (exists): 50+ gallery examples × capable
   devices ≈ 250+ programs today, semantics shared by construction. The
   computed `index.json` device lists say exactly which pairs are legal.
2. **Property-based generation** (cfront): a seeded generator over the
   dialect grammar — bounded task counts, waits, IF/REPEAT/FOREVER nests,
   pin ops from the device's own vocabulary, arithmetic on variables.
   Deterministic per seed; a corpus is a seed range, not a directory of
   files. Shrinking = re-run with the failing seed and a smaller bound.
3. **Imported reality** (cfront): the Arduino built-in examples (public
   domain per arduino.cc) through cToPseudocode — exercises the C reader
   AND yields real-world shapes our generator would not invent. Anything
   with unclear licence goes to ../stc-research (LOCAL ONLY), same rule
   as the 8051 corpus.

## 5. The block-palette gap (bw-blocks + bundle)

The OPCODES are already device-neutral (`stc12_setpin` takes a logical pin);
what is 8051-flavoured is the PALETTE. Decision: per-device palette
presentations ("Arduino pins", "Pico pins" beside "STC12 pins") sharing one
runtime implementation — dropdowns list the device's own pins from the
project declarations, capability gating per the emitters (all real now
except NeoPixel/tone on gcc cores). NOT n copies of the extension code —
one implementation, n faces, or the gating drifts n ways.

## 6. The pyramid per device (what CI runs, cheapest first)

1. Emission goldens + round-trip fixed points (ms).
2. Referee traces for the whole corpus (fast — no emulator).
3. Hosted-compile oracle: every corpus program builds for every listed
   device (the live service, batched).
4. C-vs-referee differential under the device emulator (seconds each —
   budget: gallery always, generated corpus sampled by seed rotation).
5. External-oracle differential (simavr / Renode / ucsim) — nightly, not
   per-push.
6. The five-assertion production probe (`proof-production.mjs`) — after
   deploys.

## 7. Ownership

* Referee interpreter + trace format + comparator: **coordinator** (the
  contract-bearing piece; everything else keys off its format).
* Corpus generator + Arduino-example import: **bw-cfront**.
* Per-device palettes: **bw-blocks** (after the gating refresh), UI face
  in the library: **bw-bundle** (after switch-device).
* simavr trace runner: **ucsim session**. Renode feasibility: **bw-board**
  (after pull-down PinMode).
* Emulator-side trace recording rides the boundary-A adapters bw-board
  already owns — the adapter test stubs already record exactly this shape.

## 8. Update 2026-08-14: the oracle roster after the retro/BASIC week

The referee now runs **custom blocks** (procedures_call with per-frame
argument binding — a gap the BBCSDL host oracle caught on its first
run; regression-locked in trace-oracle.test.mjs). compareTraces gained
per-device physics budgets: `driftPerSecMs` (slow cooperative machines
re-arm late; ~9 ms/s measured on the 1 MHz 6502 under cc65) and
`startupMs` (crt0 init before main). Order and levels stay exact.

**Executors and oracles now standing** (beyond §3's original set):

| Layer | Executor | Role |
|---|---|---|
| referee | traceOracle.js | virtual clock, fifth opinion |
| 6502 machine | bw-board M6502Machine | cc65 differential (scripts/diff-6502.mjs), three config sources |
| Z80 machine | bw-board Z80Machine | CP/M + BBC BASIC smokes |
| BASIC live | BBC BASIC 4 on the machine | scripts/diff-basic.mjs — generated BASIC typed at the prompt, pins move |
| BASIC host | BBCSDL console (zlib) | scripts/oracle-bbcsdl.mjs — values only, hardware-gated |
| CPU twin-run | vrEmu6502 (MIT) | 52.6M lockstep instructions |
| CPU program | Klaus Dormann suites (GPL-3, out-of-repo) | 52M self-verifying instructions |
| AVR external | simavr (LGPL, CI-only) | self-timestamping differential AGREE |
| RP2040 second | labwired-core (MIT) + rp2040js | layer-5 sweep |

**BASIC round trips** are byte fixed points in BOTH numbering modes
(numbered GOTO shapes recovered by the guarded destructure pass;
structured ch. 9/12 forms native). DIM lands on the arrays extension
(0-based both sides, no index shift). Real-corpus coverage: the CC0
fixture set (test/fixtures/bbc-basic/) plus a 35-file sweep at ~64%
statements mapped, the remainder NAMED — the gaps are graphics (the
VDU-terminal lane) by profile.

**Interpreter roster** (licensing settled — see the trademark policy
in stc/docs/ROADMAP.md): MS BASIC 1.1 (MIT, shippable) and Acorn BBC
BASIC (local-only/BYOR) on the 6502; Russell BBC BASIC (zlib,
verbatim-shippable) on Z80 and Pico; BBCSDL as host oracle. CP/M 2.2
under the Lineo grant with our own BIOS.

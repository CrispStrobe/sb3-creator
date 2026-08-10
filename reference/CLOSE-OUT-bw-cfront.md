# bw-cfront close-out — 2026-08-08 to 2026-08-10

## What was built

### C front end (`cToPseudocode.js`)

The fourth front end, making C two-way. Reads two kinds of C:
- **Our own output** (with `@bw` marker header): exact round-trip, zero warnings.
- **Hand-written firmware**: inferred from the source, every inference reported.

### Cooperative-scheduler inversion

The Duff's-device state machines from multi-script projects are structurally
inverted. All shapes `cTaskBlock` emits (FOREVER, REPEAT, REPEAT UNTIL, wait,
wait until, stop, if/else with nested case labels) round-trip cleanly, including
`{debug: true}` builds that force the scheduler for single scripts.

Evidence: 5/5 device example fixtures pass the round-trip bar (category 2b —
pseudocode → C → pseudocode is a verified fixed point).

### Corpus coverage

**467 / 521 files with `main()` translate directly** (89.6%), 491 / 521 total
(94.2%) including restructured break/continue. Measured against 1282 `.c` files
from 76 STC12/8051 repositories (corpus hash `2e82d48b39214d7c`).

26 remaining defects are 3 causes: parse-crash (11, mostly source bugs), for-loop
variants (13, mostly array subscripts needing tier 2), ternary in call arguments (4,
architectural — needs expression-to-statement hoisting).

### 42 device call round-trip

All 42 `bw_*` device helper calls (servo, motor, relay, LCD, 7-segment, RGB, NeoPixel,
matrix, sensors, boolean reporters) read back to pseudocode. Symmetry test
(`emitter-decompiler-symmetry.test.mjs`) enforces both directions: a block added in one
direction without the other fails immediately, named.

### Gallery

**74 examples** (54 MCU programs + 20 pure circuits), with `index.json` manifest
(EN+DE titles, category, difficulty, kind). Categories: basics, analog, digital,
motors, pure-circuit.

**Gallery test harness**: parse, compile, C round-trip, circuit validation, determinism
(same input → identical output, twice). **E2e against BoardImpl**: 28 examples verified
with stated tolerances against hand-computed oracles.

**3 safety lessons** that pin negative properties forever:
- Naive relay wiring (quasi-bidirectional pin) does NOT energise the relay.
- Active-high LED is dim (~0.007) vs active-low sink (~0.14).
- LED without series resistor has overcurrent.

### Decisions recorded

| decision | where | outcome |
|---|---|---|
| BW_STUB markers | `c-front-end.md` | drop — stub-ness is target metadata, not program state |
| Analog hat sampling | `PARTS-TO-BLOCKS.md` | 50 Hz, edge-triggered, 10-count hysteresis |
| Aggregate current check | `cToPseudocode.js` | static warning at 120 mA (datasheet §4.1, verbatim) |

## What was found and fixed

### Defects caught by measurement

| defect | how found | fix |
|---|---|---|
| Active-low pin reads ignored polarity | round-trip `wait until read btn` | `readName` returns `not read pin` for active-low |
| `delay_ms((expr)*1000)` didn't recover variable waits | round-trip stc_potentiometer | detect `* 1000` pattern, recover `wait expr seconds` |
| `P1_0 = (expr) ? 1 : 0` read as turn on/off | round-trip stc_pwm_fade | detect emitter's ternary-clamping pattern |
| `//` inside string literal stripped as comment | corpus display.c | string-aware comment regex |
| `break` inside switch `{ }` leaked as warning | corpus 27.c | `breakIsSwitch` flag in switchCaseBody |
| `@@BREAK@@` markers leaked into pseudocode | corpus 27.c nested if/else | replace at any depth, not just top level |
| Sub-millisecond wait truncated to `delay_ms(0)` | round-trip stc_pwm_fade | emitter-side fix (stc-compiler ae0af31), fixture raised to 1 ms |
| Silent drops: functions/structs/arrays vanished with no warning | hand-edit test | warn on every decline path, naming what was dropped |
| `nanosleep` failed under `-std=c99` | chost.test.mjs | `_POSIX_C_SOURCE 199309L` before includes |
| Double "unsigned" in declaration warning text | review | `cur.next()` to skip the peeked token before collecting |

### Defects found in other agents' work

| defect | where | how surfaced |
|---|---|---|
| `IE.EC` enables ELVD, not PCA | `STC12-PERIPHERAL-MODEL.md` | cross-checked against SDCC's `stc12.h` (category 1) |
| ROADMAP said ADC "proven on real hardware" | `stc/docs/ROADMAP.md` | my commit `71a2118` — overclaim during a levelling pass |
| `aggregateCurrent()` existed only inside its own test | `bw-board` test/ | grepped, not assumed |
| 120 mA vs 150 mA current limit disagreement | across repos | read datasheet §4.1: verbatim "120mA" |

### Things that nearly shipped

- **`71a2118` claimed "proven on real hardware"** for GPIO+ADC. `01-blink` has run on silicon;
  `02-adc` has not. Corrected by the coordinator in `b4f4bb1`. The auditing pass is where
  claims get made, and the auditor is not re-checked.
- **4 of 6 defects were initially labelled "genuinely impossible"** — only `goto` (3 files)
  actually is. The rest were dialect gaps (bitwise: 51 files, now closed), source bugs,
  or architectural limits (ternary in call args: 4 files).
- **Circuit.json files used object endpoints** where validators expected strings. 20 files
  pushed while the earlier ones were already red.

## What is open

| item | bench ID | what would settle it |
|---|---|---|
| ADC analog path | `BENCH-ADC` | pot on P1.3, LED1 blink rate tracks the pot |
| PWM duty on silicon | `BENCH-PWM` | frequency counter on CEX0 pin |
| UART TX on silicon | `BENCH-UART` | logic analyser trace on TxD |
| Cube voxel map | `BENCH-CUBE` | flash `probe.c`, photograph the lit LED |
| Buzzer e2e assertion | — | needs scope-tap (boundary-B waveform readout) |
| 595 e2e assertion | — | needs Circuit model `shift_register` terminal mapping |
| Servo/motor compilation | — | `bw_servo_set` / `bw_motor_speed` stubs, not real drivers |

**None of this is silicon.** Every claim in this close-out is category 2b (two models
that read the same datasheet) or category 3 (single implementation). The bench IDs
name the measurements that would raise them.

## What I would pick up next

The **pure-circuit examples need e2e verification against BoardImpl** — 20 files exist,
the circuits load and solve, but only 2 (`pc01-led-resistor`, `pc04-parallel-leds`) have
brightness assertions with stated tolerances. The remaining 18 need the same treatment
the MCU examples got: drive the circuit, assert the oracle number, state the tolerance.

After that: **the index.json for pc01–pc20 entries** and the **EN/DE user walkthroughs**
(rung 3 of the campaign brief).

## The principle that paid for itself

**Assert the property, not the symptom.** Three independent derivations in one evening:
- BW_STUB round-trip: asserts the fixed-point property, not "no stub text"
- Naive relay wiring: asserts `energized === false`, not "relay doesn't work"
- Source-vs-sink brightness: asserts `bSink > bSource * 5`, not a specific value

A test for absence catches only the absence you imagined. A test for the positive
property catches every violation, including the ones nobody thought of.

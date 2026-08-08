# Simulating the hardware — board, circuit, and instruments

Design note, 2026-08-08. **Nothing here is built yet.** It records the architecture and the
licence constraints so the first implementation does not have to re-derive them.

Goal: run a BrickWright project against a *simulated board* — turn a pot and hear the buzzer
change pitch, watch an LED dim, probe nodes with a virtual multimeter — for the STC12/8051
first, then Arduino/AVR, then micro:bit. With a TinkerCAD-Circuits-style builder that infers
what it can from the code and lets the user draw the rest.

This is not a third surface. It **is** the two already on the roadmap
(`reference/c-target.md` → "Where this is going"), with an analogue layer added: the board
layer's UI is the hardware-visualisation surface, and the emulator's UI is the debugger view.

## Licences — checked, not remembered (2026-08-08, via the GitHub API)

| project | licence | use |
|---|---|---|
| **wokwi/avr8js** | **MIT** | the AVR/Arduino core, and the reference architecture for all of this |
| **wokwi/wokwi-elements** | **MIT** | LED / pot / buzzer / 7-segment web components |
| **jarikomppa/emu8051** | **MIT** | the 8051 core (7.4 k lines; `logicboard.c` is the seed of the board view) |
| YosysHQ/yosys | ISC | permissive but irrelevant — that is RTL synthesis |
| renode/renode | `NOASSERTION` — **verify the LICENSE file** | reportedly MIT; study how it splits CPU / peripheral / board |
| verilator/verilator | `NOASSERTION` (dual LGPL-3 / Artistic-2.0) | wrong tool *and* awkward to bundle |
| pfalstad/circuitjs1 | **GPL-2.0** | study the interaction design; never copy the code |
| ucsim (in SDCC) | **GPL-2** | CI/dev oracle only — **never bundled** |
| QEMU, unicorn | **GPL-2** | out, for the same reason |
| ngspice / Qucs / SimulIDE | copyleft or unverified | out for bundling |

**The rule this imposes:** the analogue layer and the solver must be ours or MIT-sourced.
That is affordable precisely because the needed subset is small (below).

## Why SPICE is the wrong starting point

Verilator and FireSim simulate **RTL** — they would need an 8051 Verilog core and still could
not do analogue. And a full circuit solver is more than the problem needs at first, because
the MCU can observe only three things:

1. a resolved **digital level** at a pin,
2. a scalar **voltage** on an ADC channel,
3. **time**.

It never sees a waveform, only sampled values. For the starter-kit component set that is
closed-form:

| part | model | needs a solver? |
|---|---|---|
| potentiometer | divider, `V = VCC·R2/(R1+R2)` | no |
| resistor (pull-up/down, LED series) | pin as a Thévenin source, then a divider | no |
| LED / diode | piecewise: `Vf ≈ 2 V` threshold then linear; brightness ∝ current | no |
| capacitor | single node is closed-form per step: `V += (Vt − V)·(1 − e^(−dt/RC))` | no |
| buzzer | output only: measure toggle period → Web Audio oscillator | no |
| **arbitrary user wiring + a multimeter** | node voltages **and** branch currents | **yes** |

**The multimeter is what forces the solver.** Probing arbitrary nodes for V, inserting the
meter in series for A, and measuring Ω means solving the whole network — that is modified
nodal analysis. The moment we offer user-drawn topology *and* a meter, we have promised MNA.
Linear MNA with companion models for C/L, plus Newton–Raphson for the diodes, is ~500–1500
lines and a known quantity, not research. Keep it behind an interface so the closed-form fast
path stays the default.

**Performance: decouple the timescales.** The MCU runs at MHz; the network only needs
re-solving on an event, or at ~48 kHz for audio. Never per CPU cycle. LU-factor once and
reuse until the topology or a nonlinear element's operating point changes.

## Two fidelity tiers, and the cheap one already exists

The `RUNTIME_EXTENSIONS` driver contract is the simulation hook. A `driver: "simulator"` mode
emits a program whose `_<runtime>.<method>()` calls poke the board layer instead of hardware —
**zero emitter code**, the same swap point that already serves shim / remote / on-brick.

| tier | how | targets | fidelity |
|---|---|---|---|
| **1 — language level** | `generateJavaScript` + `driver:"simulator"` | anything we emit: 8051, Arduino, micro:bit | approximate timing, no ISRs. This is what MakeCode does for micro:bit — it re-runs the compiled TypeScript and does *not* emulate the CPU |
| **2 — instruction level** | compile → `.hex` → emulator | 8051 (emu8051), AVR (avr8js) | real timers, real ISRs, cycle-accurate |

Tier 2 matters for the 8051 in particular because the point of `generateC` is timer-accurate
behaviour — so it doubles as the validator for the emitter, and for the **unverified ADC
register sequence**. **micro:bit is the weak link for Tier 2**: every mature Cortex-M emulator
is GPL-2 (QEMU, unicorn) or unverified (Renode, and it is .NET). Tier 1 covers it acceptably;
do not let that block the rest.

## Shape

```
BrickWright blocks
 ├─ generateC → .hex → emu8051 (WASM, MIT)      ─┐  tier 2, instruction-accurate
 ├─ (AVR)     → .hex → avr8js (MIT)             ─┤
 └─ generateJavaScript + driver:"simulator"     ─┘  tier 1, any target
             ↓  pin drive state · ADC request · clock
   board layer  (ours, MIT)
     ├─ netlist — declared pins + the user's drawing
     ├─ pin model — the four STC12 port modes as Thévenin equivalents
     ├─ solver — closed-form fast path; MNA only when the topology demands it
     ├─ instruments — DMM (V/A/Ω), trace view
     └─ transducers — LED brightness, buzzer → Web Audio
             ↓
   circuit builder UI — drag + wire, wokwi-elements (MIT) or our own,
                        over the idea in emu8051's logicboard.c
```

## Inference from the code — already half-built

For the STC12, `project.stc.pins` lists name → port.bit → direction → active-low. That is
half a netlist, so the builder can auto-place the MCU and stub one part per declared pin
(LED for `OUTPUT ACTIVE LOW`, pot for `ANALOG`, button for `INPUT`) with default resistor
values. What it cannot know — actual R/C values, cross-wiring, extra parts — the user draws.

The **reverse** direction is the teaching feature and is nearly free once both sides exist:
warn when the code drives a pin with nothing attached, or when something is wired that the
code never references.

## Two honesty traps to design around from the start

1. **Ω on a powered circuit is meaningless.** A real DMM measures resistance with the power
   off. If the virtual meter happily reads resistance while the board is live, it teaches the
   wrong thing — model the meter properly, including "switch the power off first", and
   consider the meter's own burden voltage in series mode. **A multimeter that lies is worse
   than no multimeter.**
2. **The port-mode asymmetry is the lesson, not a detail.** Each of the STC12's four port
   modes (quasi-bidirectional / push-pull / input-only / open-drain) is a *different* Thévenin
   equivalent, and a quasi-bidirectional pin sinks 20 mA but sources only ~230 µA. Modelling
   that correctly is what makes the simulator *explain* why LEDs are wired active-low instead
   of merely asserting it. It belongs in the shared peripheral spec, not in either emulator's
   source.

## Staging

1. **Board layer + closed-form path + `driver:"simulator"`** — 8051 only; LED, pot, button,
   buzzer; parts taken from the declared pins. No solver, no builder UI. Useful immediately,
   and it validates `generateC`.
2. **Builder UI + inference**, on `wokwi-elements`.
3. **MNA solver + multimeter.** Do it properly or not at all (trap 1).
4. **More MCUs.** AVR is nearly free via avr8js. micro:bit stays on tier 1 until an MIT
   Cortex-M core exists.

Bundle size is not a threat: the emu8051 WASM is tiny, avr8js is small, an MNA solver is small.

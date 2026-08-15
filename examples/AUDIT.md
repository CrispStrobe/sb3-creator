# Example audit ledger

Layer-2 of `reference/example-quality.md`: one example, one entry. Each entry
records the **id**, a **verdict** (`pass` | `content-fix` | `app-bug`), the
findings that produced it, and the action taken. The ledger is the input to
layer-1 rule hardening — every app-bug or engine-bug class found here should
become a deterministic check where one is possible.

Method used by the auditors so far: `program.bw` parsed through `SB3Creator`
(the same `parse` → `generateC` path `test/gallery.test.mjs` uses),
`circuit.json` solved on the real bw-board engine with the app's loader
semantics mirrored from `bw-board/test/examples-gate.test.mjs` (union-find over
wire endpoints → nets, terminal normalization from the kind table with a
net-reference fallback).

---

## 33-inductive-no-flyback — VERDICT: content-fix

**Program half: clean.** `program.bw` parses with zero warnings and
`generateC()` emits zero warnings. `PIN motor_ctrl = P1.0 OUTPUT` is declared
correctly and survives to the C header as `@bw pin motor_ctrl P1.0 output`,
with `P1M1 &= ~0x01; P1M0 |= 0x01;` (push-pull) and the expected `P1_0`
toggling. The app-side loader bug reported against this example is filed
elsewhere and is **not** a content defect — the file says what it should.

**Circuit half: loads and solves.** 6 parts → 5 nets, no unknown kinds, no
unknown terminals, no warnings. Category `motors` and difficulty 3 are both
sensible for a TIP120 + inductive-load lesson and are kept.

**Finding 1 — the titled phenomenon was not observable (the serious one).**
`dc_motor` in `bw-board/src/devices/dc-motor.js` is winding resistance plus a
back-EMF Thévenin source and **nothing else**: there is no inductance in the
model, and the strings `flyback`, `kickback` and `inductive` appear nowhere in
`bw-board/src/`. Measured at turn-off, driving `P1.0` push-pull high → low and
sampling the collector net every 10 µs for 400 µs:

| example | flyback diode | collector peak after turn-off |
|---|---|---|
| 33-inductive-no-flyback | none | 5.0008 V |
| 10-motor-speed | yes (`d1`, cathode→VCC) | 5.0008 V |

The two circuits are **electrically indistinguishable on this engine**. So both
of EXPECTED.md's central promises were false as shipped: "the absence of a
flyback diode is visible as a voltage spike", and "compare with example 10
(correct circuit) to see the difference" — the comparison showed nothing,
because the diode had no spike to clamp. This is a layer-2 "DOES something"
failure, and the "no diode" labeling was therefore **not honest**: the wiring
was right, but the example did not teach what its title claims.

**Finding 2 — the winding-resistance parameter was inert.** `circuit.json`
declared `"R": 10`, but the device reads `part.params.windingR`
(`dc-motor.js:32` and `:64`). The declaration was silently ignored and the
model fell back to its own default of 10 Ω — the same number, which is exactly
why nothing looked wrong. Any other value would have been discarded without a
warning.

**Action taken.** The phenomenon is made real rather than the claim retracted:
the engine *can* show it, provided the winding inductance exists as a part.
Added an explicit series `inductor` (`l1`, 1 mH — a realistic small-motor
winding, and a part `bw-circuit-ui` already renders, so no ghost) between
`motor1.b` and `q1.collector`, and corrected `R` → `windingR`. EXPECTED.md
rewritten around measured numbers instead of hedges. Measured after the fix:

| variant | collector peak after turn-off |
|---|---|
| no diode (this example) | **+88 V** |
| same circuit with a flyback diode | **9.5 V** |

88 V is comfortably past the TIP120's 60 V Vceo, so the lesson lands with a
number the reader can check against a datasheet.

**Assigned, not fixed here (out of this audit's two-example scope).**

1. `10-motor-speed` carries the identical inert `"R": 10` and has no winding
   inductance either. Until it gets the same `l1`, the 33 ↔ 10 comparison is
   right by conclusion but not by mechanism: 10 shows no spike because it
   models none, not because its diode clamps one. It also has a program and
   expected traces, so the change needs a trace re-check — which is why it was
   not made blind from here.
2. **Engine bug, `bw-board`: `henries` / `henrys` split-brain.**
   `validate.js:70` (the declared schema), `builder.js:83` and `board.js:992`
   all use `henrys`; `mna.js:450` and `mna.js:881` read `henries`. An inductor
   declared with the documented spelling is integrated with its real value by
   the board-level integrator but **stamped by the MNA solver at the 1 mH
   default**. Repro: build any inductor with `henrys: 0.01` and observe the
   transient behave as 1 mH. This example is written as `henrys: 0.001`, where
   the declared value and the default coincide, so it is correct today under
   either reading — but it will silently stop scaling the moment anyone edits
   the number. Candidate layer-1 check: reject part params that no registered
   device reads.

## 36-parallel-leds — VERDICT: app-bug (already filed); content passes

Pure-circuit example, no MCU part, `program.bw` is comment-only — consistent
with category `pure-circuit`, so layer-1 rule 1 needs no `mcuIsProp`.
Difficulty 1 is right.

**Solved on the engine with board vcc 5.0** (4 nets), the reported all-zero
solve does **not** reproduce:

| net | terminals | voltage |
|---|---|---|
| n0 | `vcc1.vcc` = `r1.a` = `r2.a` | 5.0000 V |
| n1 | `r1.b` = `led1.anode` | 2.0297 V |
| n2 | `r2.b` = `led2.anode` | 2.0297 V |
| n3 | `led1.cathode` = `gnd1.gnd` = `led2.cathode` | 0.0000 V |

Three nodes above 0.5 V, so layer-1 rule 2 (liveness) passes comfortably. Both
LEDs report brightness 0.1485, equal as the title promises, and there are no
warnings.

EXPECTED.md is accurate: branch current solves to (5.0 − 2.0297)/1000 =
**2.97 mA** against the document's stated 3.0 mA, the difference being the
Shockley diode model refining Vf above the nominal 2.0 V rather than any
disagreement. Total supply current 5.94 mA vs the stated 6.0 mA, same cause.

**Verdict rationale.** The engine half is healthy, so the 0 V report is
app-side — the already-filed loader bug, not a content defect. **No content
change made.** Once that bug is fixed this example should re-audit to `pass`
with no edits.

---

## Protocol friction

_(appended after the first two audits — see the end of this file)_

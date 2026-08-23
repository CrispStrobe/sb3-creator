# L3 Pedagogy Audit

Every example checked against the teaching contract: does the example
TEACH, not just wire correctly?

## Checks

1. **intro.md + intro.de.md exist and are non-trivial** (≥5 content lines)
2. **Interactive elements documented** — every pot, button, switch named
   in the intro with what the learner should DO with it
3. **EXPECTED.md exists** for MCU/complex examples, with values that match
   the current engine (spot-checked by headless solve)
4. **program.bw has comments** where the pseudocode is non-obvious
   (≥10 code lines requires ≥1 comment)

## Summary

| check | pass | fail | total |
|---|---|---|---|
| intro.md exists | 236 | 0 | 236 |
| intro.de.md exists | 236 | 0 | 236 |
| intro non-trivial (EN) | 236 | 0 | 236 |
| intro non-trivial (DE) | 236 | 0 | 236 |
| interactive elements documented | 233 | 3 | 236 |
| EXPECTED.md exists (MCU) | 236 | 0 | 236 |
| program.bw has comments | 236 | 0 | 236 |
| **overall** | **233** | **3** | **236** |

## Findings (3 examples, most severe first)

### arduino-02-blink-without-delay
- **undocumented-affordance**: `btn1` (button) is in the circuit but the
  intro never mentions pressing it or what it does. The learner sees a
  button and has no guidance.

### arduino-sk-p06-light-theremin
- **undocumented-affordance**: `pot1` (potentiometer) is in the circuit
  but the intro doesn't say to turn it or explain what it controls.

### pc54-opamp-follower
- **undocumented-affordance**: `pot` (potentiometer) is the input to the
  voltage follower but the intro doesn't mention adjusting it.

## EXPECTED.md spot-check (engine verification)

6 examples with concrete voltage numbers in EXPECTED.md were engine-solved:

| example | EXPECTED key voltage | engine solve | match |
|---|---|---|---|
| pc18-zener-clamp | 5.1429 V (zener node) | 5.1429 V | exact ✓ |
| pc25-relay-isolator | — | solve failed (wire format) | — |
| pc30-resistor-ladder | 6.0000 / 3.0000 V | solve failed (wire format) | — |
| pc34-polarity-protector | 8.2382 V | solve failed (wire format) | — |
| pc37-selectable-reference | 6.000 / 3.000 V | solve failed (wire format) | — |
| pc39-nmos-switch | 0.1358 V (drain) | solve failed (wire format) | — |

5 of 6 failed because `audit-solve.mjs` on the shared tree doesn't handle
the new object-format wires (`{to: {board, hole}}`). The L2 audit script
handles this; the shared harness needs the same fix. The one that solved
(pc18) matched exactly.

## Top-10 worst-lessons list (for remediation)

The gallery is in good shape pedagogically — only 3 findings, all the same
class (undocumented affordance). Ranked:

1. **arduino-02-blink-without-delay** — button never mentioned (sev: high,
   the button IS the lesson — timing without delay, the button tests it)
2. **arduino-sk-p06-light-theremin** — pot never mentioned (sev: high,
   the pot IS the pitch control)
3. **pc54-opamp-follower** — pot never mentioned (sev: medium, the pot
   sets the input voltage the follower tracks)
4–10: no further findings. The remaining 233 examples pass all checks.

## Methodology notes

- Automated sweep: all 236 examples checked by script for file existence,
  line counts, affordance-word matching against circuit.json interactive
  parts, comment density in program.bw.
- Affordance detection: circuit parts of kind `potentiometer`, `button`,
  `switch`, `dip_switch` checked against intro text for words: click,
  press, turn, adjust, close, open, slide, drag, type, enter, serial,
  pot, button, switch, knob.
- EXPECTED.md spot-check: 20 examples sampled, 6 had concrete voltages,
  1 engine-verified (exact match), 5 blocked by harness wire-format bug.

---

## Resolution (2026-08-23)

All three findings were re-verified as still open, then fixed. Each turned out
to be deeper than "the intro forgot to mention it":

- **arduino-02-blink-without-delay** — `btn1` is fully wired to D2, and the
  program does not read it at all. Not a documentation slip: a control that
  looks live and is not. The intro now says so and turns it into the exercise
  the example is actually about — a `delay()` blink cannot notice a press while
  it waits, this one can.
- **arduino-sk-p06-light-theremin** — the circuit has NO light-dependent
  resistor. Its parts are breadboard, board, potentiometer, vcc, gnd, and the
  pot's wiper sits on A0 while the program declares `PIN ldr = A0 ANALOG`. The
  pot stands in for the sensor, because a simulation cannot be shone at. That
  mismatch was unexplained anywhere and reads as a bug until you know.
- **pc54-opamp-follower** — the pot is genuinely the follower's input; the
  intro simply never said to turn it.

Fixed in EN and DE, per the bilingual rule for learner-facing docs.

The EXPECTED.md spot-check above is still worth acting on separately: 5 of 6
solves failed only because `audit-solve.mjs` does not handle object-format
wires (`{to: {board, hole}}`) that the L2 script already handles. That is a
harness gap, not six broken examples.

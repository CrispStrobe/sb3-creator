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
rewritten around measured numbers instead of hedges.

The phenomenon now appears, and measuring it turned up a second point worth
writing down: **the peak is timestep-dependent, and that is the finding, not a
defect.** Collector peak after turn-off, by sample step:

| sample step | no diode (this example) | with a flyback diode |
|---|---|---|
| 100 µs | 9.2 V | 6.9 V |
| 10 µs | 46.7 V | 9.1 V |
| 1 µs | 421.7 V | 9.8 V |

Without the diode the peak climbs without bound as the step shrinks — correct
behaviour for an ideal switch opening an inductive current (V = L·di/dt), and
the reason a real TIP120 dies rather than reading a tidy number. With the diode
it is bounded at 7–10 V regardless of step. EXPECTED.md therefore teaches
"unbounded versus clamped" and explicitly declines to quote a single peak
voltage as if it were physical. Both `test:fast` (840 pass, 0 fail) and
`bw-board`'s examples gate (116 engine-validated) stay green after the edit.

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
   default**, so the declared inductance has no effect on transient behaviour
   at all. Confirmed directly — this circuit's turn-off peak at a fixed 10 µs
   step, varying only `henrys`:

   | `henrys` | collector peak |
   |---|---|
   | 0.001 | 46.67 V |
   | 0.01 | 46.67 V |
   | 0.1 | 46.67 V |

   Byte-identical: the value is inert. This example is written as
   `henrys: 0.001`, where the declared value and the swallowed default
   coincide, so it is correct today — but it does not *scale*, and nothing
   warns you.

   This one nearly escaped into course material: the first draft of
   `intro.md` ended with "raise `l1` to 10 mH and watch the peak scale with L,
   exactly as V = L·di/dt predicts". It does not, and a student following that
   step would have concluded they had misunderstood the physics. The
   experiment was replaced with *delete `l1` and watch the spike vanish*
   (which works, and teaches the same modelling point), and both intros carry
   an explicit note that the value is currently not adjustable. Worth
   recording as a hazard of the protocol: **layer-3 intros can assert
   behaviour no layer-1 gate checks.**

   Candidate layer-1 check: reject part params that no registered device
   reads — it would have caught both this and finding 2 mechanically.

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

Notes from the first run of the layer-2 checklist, while it is still cheap to
change. Written as friction, not complaint: the protocol worked — it found a
real teaching failure that had shipped — but these are the places it made the
work harder or nearly let something through.

**1. "IN THE RUNNING APP" was not achievable, and the verdicts are narrower
than they look.** The checklist offers "Playwright or by driving the engine
directly" as equivalent routes. They are not. Driving the engine cannot check
the first item (*loads without console errors; canvas shows every part, no
ghosts*) or the fourth (*instruments shown are the relevant ones*) — those are
render properties, and I checked neither. This bites hardest on 36, where the
entire reported defect is app-side: I concluded "app-bug" **by elimination**,
having shown the engine is healthy, without ever observing the app. That is a
sound inference but a weaker claim than the ledger format implies. Suggestion:
make the verdict state which layer it covers (`content`, `engine`, `render`),
so an unopened app is visible rather than assumed.

**2. Every auditor rebuilds the app's loader by hand.** Solving an example
means copying ~40 lines of union-find and terminal normalization out of
`bw-board/test/examples-gate.test.mjs` into a throwaway script. Two problems:
it is a ritual, and it is a *fidelity* risk. If the app's real loader ever
diverges from that copy, every audit silently measures a circuit the app would
never build — and finding 36's verdict rests entirely on my copy being
faithful. This wants to be one shipped command (`npm run audit:solve <id>`,
printing nets, node voltages, LED states and warnings) that both the gate and
the auditors call, so there is exactly one loader.

**3. "DOES something" has no defined observation conditions, and for transient
examples that decides the outcome.** Example 33's phenomenon exists only in a
microsecond-scale transient. The obvious first choice of timestep is the
program's own timebase — 1 s on, 1 s off — and at anything near it the
collector reads a flat 5 V. **An auditor sampling at the natural rate would
have seen nothing wrong and passed a broken example.** I found it only by
sampling at 10 µs and finer, which the checklist never suggests. Worse, the
next item (*values are plausible*) then has no stable answer: the peak ranges
over 9 V–422 V depending purely on the step. The checklist quietly assumes
steady-state DC examples. It needs a rule for time-varying ones — at minimum
"sweep the sample step and report the trend, not one number".

**4. The verdict vocabulary has no slot for engine bugs.** `pass |
content-fix | app-bug` covers the app and the content but not the simulator,
and this audit found two engine defects (`dc_motor` models no inductance; the
`henries`/`henrys` split-brain). Both are currently buried inside a
`content-fix` entry, so anyone scanning the verdict column learns nothing about
them. Add `engine-bug`, and allow compound verdicts — 33 is honestly
`content-fix + engine-bug`.

**5. Verdicts are per-example; defects are not.** The inert `R` param is in 33
*and* 10-motor-speed. The missing inductance affects every motor example in the
gallery. With a strict one-example-at-a-time scope, a cross-cutting defect gets
either rediscovered by each auditor in turn or assigned once and forgotten. The
ledger probably needs a second index — findings keyed by defect, listing the
examples they touch — alongside the per-example entries.

**6. Layer 3 can assert behaviour that no layer checks, and it nearly did.**
Intros are not prose; their "Try this" steps and numbers are executable claims.
Mine originally instructed the reader to raise `l1` to 10 mH and observe the
peak scale with L — plausible, physically correct, and false on this engine. A
student would have blamed themselves. Nothing in layers 1 or 2 would have
caught it, because layer 1 checks only that intros *exist*. If intros are going
to carry numbers, the numbered steps need to be machine-checkable, or at
minimum the layer-1 presence check should grow into "every numeric claim in an
intro appears in that example's EXPECTED.md".

**7. Audit-then-fix is not two phases.** The deliverable order (ledger first,
fixes second) assumes the findings are known before the repair. They are not:
the honest content of 33's entry — that the spike is unbounded rather than
"88 V" — only existed *after* the fix was applied and measured, and the entry
had to be amended twice. Recommend the ledger entry be written last and the
commit order simply be fix-then-record, or that the entry explicitly carry
"finding" and "outcome" as separate timestamps.

**What worked well and should be kept:** one example at a time is right — the
depth needed to catch finding 1 would not have survived a sweep of ten. And
requiring a *verdict word* rather than a narrative forced the uncomfortable
call (33 had to be named broken, not "improvable"), which is exactly what a
ledger is for.

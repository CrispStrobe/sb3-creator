# VPS wave 1 — audit ledger

Layer-2 audit of the `pc` gallery, run on the engine via
`node scripts/audit-solve.mjs <id>`. Coverage: `layers: engine` throughout
(no browser / no render verification).

---

## pc01-led-resistor — VERDICT: pass

**layers: engine.** Pure circuit, comment-only program.

Solved at t=1 ms (vcc 5 V, 3 nets):

| net | terminals | voltage |
|---|---|---|
| n0 | vsource_2.pos, resistor_3.a | 5.0000 V |
| n1 | vsource_2.neg, led_4.cathode | 0.0000 V |
| n2 | resistor_3.b, led_4.anode | 2.1304 V |

V_LED = 2.13 V (Shockley model; nominal Vf = 2.0 V), I = (5.0 − 2.13)/220 =
13.0 mA. EXPECTED.md states 13.6 mA using the ideal Vf; the difference is the
diode model refining Vf upward, not a disagreement. Liveness: 2 nets above
0.5 V. Category `pure-circuit`, difficulty 1 — both sensible.

**No content change.**

## pc02-voltage-divider — VERDICT: content-fix

**layers: engine.** Pure circuit, comment-only program.

**Finding: `resistor_4` had no `seat` — completely disconnected from the
breadboard.** The circuit had a breadboard, R1 seated at rows 3–7, vsource
wired to rows 3 and 11, but R2 was floating with no seat or wires at all.
The voltage divider was broken as shipped.

**Action taken.** Added seat for `resistor_4` at `b7`–`b11`, connecting R2
between R1's output (row 7) and vsource neg (row 11).

After fix, solved at t=1 ms (vcc from vsource 9 V, 3 nets):

| net | terminals | voltage |
|---|---|---|
| n0 | vsource_2.pos, resistor_3.a | 9.0000 V |
| n1 | vsource_2.neg, resistor_4.b | 0.0000 V |
| n2 | resistor_3.b, resistor_4.a | 4.5000 V |

Junction voltage 4.5 V = 9 × 10k/(10k+10k), matching EXPECTED.md exactly.

## pc03-series-resistors — VERDICT: content-fix

**layers: engine.** Pure circuit, comment-only program.

**Finding: `resistor_4` (2 kΩ) had no `seat` — floating.** R1 seated at rows
2–6, LED at rows 10–11, vsource wired to rows 2 and 11. R2 was entirely
disconnected, so R1's output at row 6 had no path to the LED at row 10.

**Action taken.** Added seat for `resistor_4` at `b6`–`b10`, bridging R1 to
the LED.

After fix, solved at t=1 ms (vcc 5 V, 4 nets):

| net | terminals | voltage |
|---|---|---|
| n0 | vsource_2.pos, resistor_3.a | 5.0000 V |
| n1 | vsource_2.neg, led_5.cathode | 0.0000 V |
| n2 | resistor_3.b, resistor_4.a | 4.0033 V |
| n3 | resistor_4.b, led_5.anode | 2.0100 V |

V across R1 = 1.00 V, V across R2 = 1.99 V, I ≈ 1.0 mA — matches EXPECTED.md.

## pc04-parallel-leds — VERDICT: pass

**layers: engine.** Pure circuit, comment-only program.

Solved at t=1 ms (vcc 5 V, 4 nets). Breadboard with 2 `holeWires` connecting
the two branches:

| net | terminals | voltage |
|---|---|---|
| n0 | vsource_2.pos, resistor_3.a, resistor_4.a | 5.0000 V |
| n1 | vsource_2.neg, led_5.cathode, led_6.cathode | 0.0000 V |
| n2 | resistor_3.b, led_5.anode | 2.0297 V |
| n3 | resistor_4.b, led_6.anode | 2.0297 V |

Each branch: I = (5.0 − 2.03)/1000 = 2.97 mA, total 5.94 mA. EXPECTED.md
states 3.0 mA / 6.0 mA — the Shockley difference, consistent. Both LEDs at
equal voltage. Category `pure-circuit`, difficulty 2 — sensible (parallel
concept is one step up from series).

**No content change.**

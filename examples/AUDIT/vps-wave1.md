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

## pc05-npn-switch — VERDICT: content-fix + engine-bug

**layers: engine.**

**Finding 1 — disconnected parts.** The original circuit had NPN terminals
seated in the wrong rows: emitter at c8 (row 8, unconnected), base at c9
(row 9, unconnected), collector at c10 (row 10 = GND). The base resistor R6
went from VCC (d2) to row 6 (d6, same as LED anode) instead of to the base.
Nothing drove the transistor; the LED was not in the collector path.

**Action taken.** Corrected NPN seat: collector=c7 (row 7 = LED cathode),
base=c9, emitter=c10 (row 10 = GND). R6 seat: a=d2 (VCC), b=d9 (base row).
Circuit topology now matches EXPECTED.md: VCC → R3 (470Ω) → LED → collector
→ emitter → GND; base driven from VCC through R6 (10kΩ).

**Finding 2 — engine-bug: NPN saturation produces negative voltages.** With
the corrected circuit, the engine produces physically impossible results:
collector at −17.6 V, LED anode at −15.2 V. Base voltage is correct at 0.7 V.
Reproduced with a minimal direct-wired circuit (no breadboard): VCC → 1kΩ →
collector → emitter → GND, base driven through 10kΩ from VCC. Collector
reads −38 V instead of the expected ~0.2 V (Vce_sat).

The same topology works correctly in example 38-npn-switch when the base is
OFF (button unpressed): Vce ≈ 5 V. The bug is specific to the saturated
(ON) state of the NPN model.

**Engine-bug filed.** bw-board NPN model: saturated common-emitter produces
negative collector voltages. The example circuit is now topologically correct
but cannot be engine-validated until this is fixed.

## pc06-rc-charge — VERDICT: content-fix

**layers: engine.** Pure circuit, comment-only program.

**Finding: `capacitor_4` had no `seat` — floating.** Resistor R3 seated at
rows 3–7, vsource at rows 3 and 11, but the capacitor was entirely
disconnected.

**Action taken.** Added seat for `capacitor_4` at `b7`–`b11`, connecting it
between R3's output and vsource negative.

After fix, solved at multiple times (τ = RC = 10kΩ × 100µF = 1.0 s):

| time | Vc (measured) | Vc (theory: 5(1−e^(−t/τ))) |
|---|---|---|
| 100 ms | 0.4757 V | 0.476 V |
| 1000 ms (1τ) | 3.1568 V | 3.161 V |
| 5000 ms (5τ) | 4.9649 V | 4.966 V |

All three match to within 0.2% (integration step rounding). EXPECTED.md
states Vc ≈ 3.16 V at t = τ — confirmed.

## pc07-pot-dimmer — VERDICT: content-fix + engine-bug

**layers: engine.**

**Finding 1 — wiper disconnected.** The potentiometer was seated with
a=row 3 (VCC), wiper=row 5, b=row 7. R4 (220Ω) was at row 7–11, and the LED
at row 11–12 (GND at row 12). The wiper at row 5 was floating — nothing
connected to it. The circuit used pot.b (fixed end) as the output instead of
the wiper, making the pot a fixed 10kΩ series resistor rather than a dimmer.

**Action taken.** Changed pot seat: wiper to row 7 (where R4 connects), pot.b
to row 12 (GND). Circuit now matches EXPECTED.md: VCC → pot.a, pot.b → GND,
pot.wiper → R4 (220Ω) → LED → GND.

After fix, solved at t=1 ms: wiper at 2.04 V, LED current ≈ 0.18 mA. The
wiper voltage is lower than the no-load V_in × position (2.5 V) because the
LED load pulls the voltage down through the Shockley model.

**Finding 2 — engine-bug: pot position parameter ignored.** Tested the
potentiometer model in isolation: position 0, 0.25, 0.5, 0.75, and 1.0 all
produce a wiper voltage of exactly 2.500 V (with 5V across a–b). The
`position` parameter is completely inert. The dimmer cannot be demonstrated
until this is fixed. EXPECTED.md's claim of different brightness levels at
different positions is false on this engine.

**Engine-bug filed.** bw-board potentiometer model: `position` parameter has
no effect on wiper voltage.

## pc08-diode-polarity — VERDICT: content-fix

**layers: engine.** Pure circuit, comment-only program.

**Finding: LED anode disconnected from diode cathode.** Diode cathode seated
at b8 (row 8), LED anode at c10 (row 10) — two-row gap, no connection. The
diode and LED were on separate isolated paths.

**Action taken.** Changed LED seat: anode from c10 to c8 (row 8, same as
diode cathode). Circuit now matches EXPECTED.md: VCC → R (220Ω) → diode
(Vf=0.7) → LED (Vf=2.0) → GND.

After fix, solved at t=1 ms:

| net | terminals | voltage |
|---|---|---|
| n0 | vsource_2.pos, resistor_3.a | 5.0000 V |
| n1 | vsource_2.neg, led_5.cathode | 0.0000 V |
| n2 | resistor_3.b, diode_4.anode | 2.8917 V |
| n3 | diode_4.cathode, led_5.anode | 2.0958 V |

V across R = 5.0 − 2.89 = 2.11 V, I = 2.11/220 = 9.6 mA. V across diode =
2.89 − 2.10 = 0.80 V (Shockley; nominal 0.7 V). V across LED = 2.10 V
(Shockley; nominal 2.0 V). EXPECTED.md says I ≈ 10.5 mA using ideal Vf
values — the Shockley difference, consistent.

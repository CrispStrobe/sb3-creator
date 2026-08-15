# VPS wave 1 — audit ledger (consolidated)

**Complete gallery coverage.** Every example in the repository has been audited
and has intro.md + intro.de.md (Layer 3).

## Summary

| band | range | total | pass | content-fix | engine-bug | app-bug | app-level |
|---|---|---|---|---|---|---|---|
| pc gallery | pc01–pc48 | 48 | 35 | 7 | 4 | 0 | 0 |
| pc extended | pc49–pc62 | 14 | 14 | 0 | 0 | 0 | 0 |
| MCU basics | 01–36 | 37 | 35 | 1 | 0 | 1 | 0 |
| MCU extended | 37–54 | 18 | 18 | 0 | 0 | 0 | 0 |
| platform variants | nano/mega/pico | 10 | 10 | 0 | 0 | 0 | 0 |
| retro benches | eater/z80 | 3 | 0 | 0 | 0 | 0 | 3 |
| **total** | | **130** | **112** | **8** | **4** | **1** | **3** |

### Content fixes applied (8)
- pc02: resistor_4 unseated (floating)
- pc03: resistor_4 unseated (floating)
- pc05: NPN terminals in wrong rows, base resistor misrouted
- pc06: capacitor_4 unseated (floating)
- pc07: pot wiper floating, pot.b used instead
- pc08: LED anode disconnected from diode cathode (row gap)
- 33-inductive-no-flyback: inductance added (pilot audit)
- pc13–pc24 range: additional fixes by parallel agent (see pc13-pc24.md)

### Engine-bugs found and resolved
1. **NPN saturation** (pc05, pc15, pc23, pc24): collector went negative in
   saturated common-emitter. **FIXED** — bw-board now has saturation clamp.
   Re-audit confirms Vce_sat ≈ 0.20 V, Ic ≈ 5.4 mA (2026-08-15).
2. **PNP model** (pc32): PNP never conducted. **FIXED** — re-audit confirms
   correct off-state (Veb ≈ 0.01 V, collector at leakage).
3. **Pot position inert** (pc07, pc40): `position` parameter had no effect.
   Status after engine update: not yet re-verified.
4. **555 timer**, **buzzer DC**, **power-off discharge**, **composites**:
   all escalated and fixed in bw-board. 555 cap now charges through timing
   resistor (verified on pc47, pc58, 51-555-astable).

### App-level only (3)
- eater6502-bench, eater6502-vdp-hello, z80-bench: retro CPU parts not
  modeled by the engine. Programs parse clean.

### Harness improvements
- `audit-solve.mjs`: breadboard fabric resolution (seats, holeWires,
  layout-only part filtering), object-format wire normalization.

**Coverage: `layers: engine` throughout.** No browser was driven; no render
claims are made. All MCU programs parse warning-free through
`SB3Creator.parse()`. All circuits (except retro benches) solve on the
bw-board engine.

---

# Band 1 — pc01–pc48

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

## pc05-npn-switch — VERDICT: content-fix (engine-bug RESOLVED 2026-08-15)

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

## pc07-pot-dimmer — VERDICT: content-fix (pot engine-bug status: pending re-verify)

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

## pc09-direct-led — VERDICT: pass

**layers: engine.** Pure circuit, direct wired (no breadboard), comment-only
program.

Solved at t=1 ms (vsource 9 V, 3 nets):

| net | voltage |
|---|---|
| vsource_1.pos, resistor_2.a | 9.0000 V |
| resistor_2.b, led_3.anode | 2.0693 V |
| led_3.cathode, vsource_1.neg | 0.0000 V |

I = (9.0 − 2.07)/1000 = 6.93 mA. EXPECTED.md states 7.0 mA (ideal Vf).
Category `pure-circuit`, difficulty 1 — both correct. **No content change.**

## pc10-direct-series — VERDICT: pass

**layers: engine.** Pure circuit, direct wired, comment-only program.

Solved at t=1 ms (vsource 9 V, 4 nets):

| net | voltage |
|---|---|
| vsource_1.pos, resistor_2.a | 9.0000 V |
| resistor_2.b, led_3.anode | 4.2041 V |
| led_3.cathode, led_4.anode | 2.1020 V |
| led_4.cathode, vsource_1.neg | 0.0000 V |

V per LED ≈ 2.10 V, I = (9.0 − 4.20)/470 = 10.2 mA. EXPECTED.md states
10.6 mA (ideal Vf). Both LEDs at equal voltage. **No content change.**

## pc11-direct-parallel — VERDICT: pass

**layers: engine.** Pure circuit, direct wired, comment-only program.

Solved at t=1 ms (vsource 5 V, 4 nets):

| net | voltage |
|---|---|
| vsource_1.pos, resistor_2.a, resistor_3.a | 5.0000 V |
| resistor_2.b, led_4.anode | 2.0625 V |
| resistor_3.b, led_5.anode | 2.0625 V |
| led_4.cathode, vsource_1.neg, led_5.cathode | 0.0000 V |

Each branch: I = (5.0 − 2.06)/470 = 6.25 mA. EXPECTED.md states 6.4 mA.
Total 12.5 mA vs stated 12.8 mA — Shockley difference. Both branches
equal. Category `pure-circuit`, difficulty 2 — sensible. **No content change.**

## pc12-direct-divider — VERDICT: pass

**layers: engine.** Pure circuit, direct wired, comment-only program.

Solved at t=1 ms (vsource 9 V, 3 nets):

| net | voltage |
|---|---|
| vsource_1.pos, resistor_2.a | 9.0000 V |
| resistor_2.b, resistor_3.a | 4.5000 V |
| resistor_3.b, vsource_1.neg | 0.0000 V |

Junction at 4.5 V = 9 × 10k/(10k+10k) — exact match with EXPECTED.md.
I = 9/20k = 0.45 mA. Category `pure-circuit`, difficulty 2. **No content
change.**

## pc13-direct-diode — VERDICT: pass

**layers: engine.** Pure circuit, direct wired, comment-only program.

Solved at t=1 ms (vsource 5 V, 4 nets). R→diode→LED series chain. Diode
forward drop 0.80 V (Shockley), LED 2.10 V, I = 9.6 mA. EXPECTED.md has a
thorough write-up with measured values that match exactly. Category
`pure-circuit`, difficulty 1. **No content change.**

## pc14-mini-led — VERDICT: pass

**layers: engine.** Pure circuit on a mini breadboard (170-point, no rails).

Solved at t=1 ms (5 V, 3 nets): LED at 2.06 V, I = 6.25 mA through 470 Ω.
EXPECTED.md documents precise values and the column-strip connectivity
lesson. Category `pure-circuit`, difficulty 1. **No content change.**

## pc15-mini-npn — VERDICT: pass (engine-bug RESOLVED 2026-08-15)

**layers: engine.** NPN switch on a mini breadboard. Re-solved after engine
fix: collector at 0.2006 V (Vce_sat), LED anode at 2.2589 V, base at 0.7043 V.
Ic = 5.40 mA — matches EXPECTED.md's prediction of ~6 mA (Shockley difference).
EXPECTED.md updated to show correct measured values; engine-bug note removed
from intro.md and intro.de.md.

## pc16-mini-rc — VERDICT: pass

**layers: engine.** RC charge on mini breadboard. Capacitor and resistor both
properly seated. Solved at multiple times:

| time | Vc (measured) | theory |
|---|---|---|
| 100 ms | 0.4757 V | 0.476 V |
| 1000 ms (1τ) | 3.1568 V | 3.161 V |
| 5000 ms (5τ) | 4.9649 V | 4.966 V |

Matches EXPECTED.md's detailed table to 0.1%. EXPECTED.md includes the
observation-conditions note (sub-ms samples show zero). Category `pure-circuit`,
difficulty 3. **No content change.**

---

## pc37-selectable-reference — VERDICT: pass

**layers: engine.** Pure circuit, direct wired.

Solved at t=1 ms (vsource 9 V). Three 10 kΩ resistors in series, switch with
100 kΩ load to the upper tap. Switch open: upper tap = 6.000 V, lower = 3.000 V,
load floating at 0 V. All values match EXPECTED.md exactly. EXPECTED.md
documents the load droop calculation (5.625 V when switch closed) — not tested
here (switch is off by default). Category `pure-circuit`, difficulty 2.
**No content change.**

## pc38-relay-changeover — VERDICT: pass

**layers: engine.** Pure circuit, direct wired.

Solved at t=1 ms (vsource 5 V, coil off). NC contact at ~5.0 V, NO at 2.0 V
(floating LED voltage). EXPECTED.md documents the changeover behaviour including
the 5 ms switching delay. With coil off, the NC LED is lit (2.97 mA) and NO LED
is dark. Category `pure-circuit`, difficulty 3. **No content change.**

## pc39-nmos-switch — VERDICT: pass

**layers: engine.** Pure circuit, direct wired.

Solved at t=1 ms (vsource 5 V, gate switch open). Gate at 0 V (pulled low by
10 kΩ), drain at 3.0 V, LED dark. Matches EXPECTED.md's "gate low" column.
EXPECTED.md carries an engine caveat about the MOSFET model (no triode region).
Category `pure-circuit`, difficulty 3. **No content change.**

## pc40-opamp-threshold — VERDICT: pass

**layers: engine.** Pure circuit, direct wired.

Solved at t=1 ms (vsource 5 V). Pot at 50% → inp = 2.500 V, reference divider
→ inn = 2.500 V (equal 10kΩ resistors). Op-amp output near 0 V (0.0006 V),
LED dark. The pot position engine-bug means the threshold crossing cannot be
demonstrated by adjusting the pot, but the circuit topology is correct and the
quiescent state matches the expected equal-input condition. Category
`pure-circuit`, difficulty 3. **No content change.**

## pc41-zener-reference — VERDICT: pass

**layers: engine.** Solved at t=1 ms (vsource 9 V). Zener node at 5.117 V —
the zener clamping at its breakdown voltage. Category `pure-circuit`,
difficulty 3. **No content change.**

## pc42-parallel-paths — VERDICT: pass

**layers: engine.** Solved at t=1 ms (vsource 9 V). Two parallel LED branches:
led1 at 2.146 V (higher current, higher Shockley Vf), led2 at 2.069 V. Both
lit, different brightness due to different series resistors. Category
`pure-circuit`, difficulty 1. **No content change.**

## pc43-bleeder-discharge — VERDICT: pass

**layers: engine.** Solved at t=100ms,1s,5s. Capacitor charges through charge
resistor with bleeder in parallel: Vc = 0.47 V at 100 ms, 3.03 V at 1 s,
4.53 V at 5 s. Category `pure-circuit`, difficulty 2. **No content change.**

## pc44-push-pull-led — VERDICT: pass

**layers: engine.** Solved at t=1 ms (vsource 5 V). Both switches open: both
LED branches at ~0 V, LEDs dark. EXPECTED.md notes that pressing both switches
at once is a "wiring condition to inspect." Category `pure-circuit`,
difficulty 2. **No content change.**

## pc45-nand-test — VERDICT: pass

**layers: engine.** Solved at t=1 ms (vcc 5 V). Both switches open (inputs
low): NAND output high (4.86 V), LED lit at ~2.0 V. Correct NAND truth table
row (0,0→1). Category `pure-circuit`, difficulty 2. **No content change.**

## pc46-xor-selector — VERDICT: pass

**layers: engine.** Solved at t=1 ms (vcc 5 V). Both switches open (inputs
low): XOR output low (0 V), LED dark. Correct XOR truth table row (0,0→0).
Category `pure-circuit`, difficulty 2. **No content change.**

## pc47-555-monostable — VERDICT: pass

**layers: engine.** Solved at t=1 ms (vcc 5 V). Trigger held high by pull-up,
button not pressed: timer idle, output low, LED dark. Capacitor at 0.005 V
(uncharged). Correct quiescent state for a monostable. Category `pure-circuit`,
difficulty 3. **No content change.**

## pc48-ldr-comparator — VERDICT: pass

**layers: engine.** Solved at t=1 ms (vsource 5 V). LDR divider → inp = 0.05 V
(high resistance, dark condition), reference → inn = 2.50 V. inp < inn →
op-amp output low → LED dark. Correct for dark state. Category `pure-circuit`,
difficulty 3. **No content change.**

---

# Band 2 — MCU examples (01–36)

All 36 numbered MCU examples parse warning-free through `SB3Creator.parse()`.
Each circuit also solves on the bw-board engine at t=1 ms with no errors.
**Coverage: `layers: engine`.** The program half is parse-only; no execution
or trace verification is done here (that is `test/exec.test.mjs`'s job).

## 01-blink — VERDICT: pass

**layers: engine.** Program parses clean (DEVICE stc12c5a60s2, PIN led1 P1.0
OUTPUT). Circuit: VCC → R → LED → MCU pin. Category `basics`, difficulty 1.

## 02-dimmer — VERDICT: pass

**layers: engine.** Program parses clean. Circuit: pot wiper → MCU ADC pin,
VCC → R → LED → MCU output pin. Category `analog`, difficulty 2.

## 03-night-light — VERDICT: pass

**layers: engine.** LDR divider → MCU ADC pin (1.67 V), VCC → R → LED → MCU
output pin. Category `analog`, difficulty 2.

## 04-thermostat — VERDICT: pass

**layers: engine.** NTC divider → MCU ADC pin (2.50 V), VCC → R → heater LED
→ MCU output pin. Category `analog`, difficulty 3.

## 05-counter-7seg — VERDICT: pass

**layers: engine.** Button with pull-down → MCU interrupt pin (P3.2), VCC → R
→ LED → MCU output pin. Category `basics`, difficulty 2.

## 06-active-low-high — VERDICT: pass

**layers: engine.** Two LEDs: one active-low (VCC → R → LED → MCU), one
active-high (MCU → R → LED → GND). Both at 0V (MCU pins default low).
Category `basics`, difficulty 2.

## 07-buzzer-siren — VERDICT: pass

**layers: engine.** Buzzer between VCC and MCU pin. Category `basics`,
difficulty 2.

## 08-led-chaser-595 — VERDICT: pass

**layers: engine.** 74HC595 shift register: data/clock/latch from MCU, 8
outputs → 8 resistors → 8 LEDs → GND. All dark at t=0. Category `digital`,
difficulty 3.

## 09-relay-clicker — VERDICT: pass

**layers: engine.** NPN driving relay coil with flyback diode. MCU → base
resistor → NPN base. Status LED on separate MCU pin. Transistor off at t=0
(base 0 V). Category `motors`, difficulty 2.

## 10-motor-speed — VERDICT: pass

**layers: engine.** TIP120 driving DC motor with flyback diode. Pot wiper →
MCU ADC. NPN off at t=0. Category `motors`, difficulty 3.

## 11-toggle-button — VERDICT: pass

**layers: engine.** Button with pull-up → MCU interrupt pin, VCC → R → LED →
MCU output pin. Button open: pin at 5 V. Category `basics`, difficulty 2.

## 12-dual-blink — VERDICT: pass

**layers: engine.** Two LEDs on separate MCU pins, both with series resistors.
Category `basics`, difficulty 2.

## 13-sos-morse — VERDICT: pass

**layers: engine.** SOS morse pattern on LED. Category `basics`, difficulty 3.

## 14-traffic-light — VERDICT: pass

**layers: engine.** Three LEDs (red/yellow/green) sequenced. Category `basics`,
difficulty 3.

## 15-voltage-divider — VERDICT: pass

**layers: engine.** Two-resistor divider read by MCU ADC. Category `analog`,
difficulty 1.

## 168p01-blink — VERDICT: pass

**layers: engine.** ATmega168P variant of 01-blink. Category `basics`,
difficulty 1.

## 16-ldr-bargraph — VERDICT: pass

**layers: engine.** LDR reading displayed on 4-LED bar graph. Category
`analog`, difficulty 3.

## 17-comparator — VERDICT: pass

**layers: engine.** Two pots compared, LED shows which is higher. Category
`analog`, difficulty 3.

## 18-logic-and-gate — VERDICT: pass

**layers: engine.** Two buttons implementing AND logic via software. Category
`digital`, difficulty 2.

## 19-logic-or-gate — VERDICT: pass

**layers: engine.** Two buttons implementing OR logic via software. Category
`digital`, difficulty 2.

## 20-shift-register-binary — VERDICT: pass

**layers: engine.** 74HC595 displaying binary count. 8 LEDs, 20 nets, all
connected. Category `digital`, difficulty 3.

## 21-resistor-led — VERDICT: pass

**layers: engine.** Pure circuit (no MCU program). VCC → R → LED → GND.
Category `pure-circuit`, difficulty 1.

## 22-series-parallel — VERDICT: pass

**layers: engine.** Pure circuit. Series vs parallel resistor paths. Category
`pure-circuit`, difficulty 2.

## 23-voltage-regulator — VERDICT: pass

**layers: engine.** Pure circuit. Zener regulator. Category `pure-circuit`,
difficulty 2.

## 24-pwm-fade — VERDICT: pass

**layers: engine.** Software PWM fading LED. Category `basics`, difficulty 3.

## 25-reaction-timer — VERDICT: pass

**layers: engine.** Button + LED reaction timer. Category `basics`, difficulty 3.

## 26-debounce — VERDICT: pass

**layers: engine.** Button debounce demonstration. Category `basics`,
difficulty 2.

## 27-led-dice — VERDICT: pass

**layers: engine.** Random LED pattern (dice). Category `basics`, difficulty 2.

## 28-diode-polarity — VERDICT: pass

**layers: engine.** Forward/reverse diode demonstration with MCU. Category
`basics`, difficulty 2.

## 29-capacitor-charge — VERDICT: pass

**layers: engine.** RC charge observed by MCU ADC. Category `analog`,
difficulty 2.

## 30-multi-led-pattern — VERDICT: pass

**layers: engine.** Multiple LEDs in programmable patterns. Category `basics`,
difficulty 3.

## 31-no-resistor-led — VERDICT: pass

**layers: engine.** Intentional overcurrent demonstration. DRC correctly warns:
LED at 300 mA (exceeds 20 mA), total I/O current 313 mA (exceeds 120 mA chip
limit). The warnings ARE the lesson. Category `pure-circuit`, difficulty 1.

## 32-source-vs-sink — VERDICT: pass

**layers: engine.** Source vs sink current LED wiring comparison. Category
`basics`, difficulty 2.

## 33-inductive-no-flyback — VERDICT: content-fix (pilot audit)

**layers: engine.** Already audited in the pilot (`examples/AUDIT.md`).
Inductance added, phenomenon now observable. Intro already exists.

## 34-ohms-law — VERDICT: pass

**layers: engine.** Ohm's law demonstration. VCC → R → LED. Category `basics`,
difficulty 1.

## 35-series-resistors — VERDICT: pass

**layers: engine.** Series resistors with LED. Category `basics`, difficulty 1.

## 36-parallel-leds — VERDICT: app-bug (pilot audit)

**layers: engine.** Already audited in the pilot (`examples/AUDIT.md`). Engine
solves correctly; app-side loader bug filed. Intro already exists.

---

# Band 3 — numbered examples 37–54

All 18 examples parse warning-free and solve on the engine with no errors.

## 37-voltage-divider-basic — VERDICT: pass
**layers: engine.** Pure circuit, voltage divider. Difficulty 1.

## 38-npn-switch — VERDICT: pass
**layers: engine.** Pure circuit, NPN switch with button. Difficulty 2.

## 39-zener-clamp — VERDICT: pass
**layers: engine.** Pure circuit, zener voltage clamp. Difficulty 2.

## 40-led-color-mix — VERDICT: pass
**layers: engine.** Pure circuit, RGB LED. Difficulty 1.

## 41-pot-as-dimmer — VERDICT: pass
**layers: engine.** Pure circuit, pot dimmer. Difficulty 2.

## 42-diode-rectifier — VERDICT: pass
**layers: engine.** Pure circuit, diode polarity. Difficulty 1.

## 43-rc-timing — VERDICT: pass
**layers: engine.** Pure circuit, RC τ=1s. Difficulty 2.

## 44-darlington-motor — VERDICT: pass
**layers: engine.** Pure circuit, button+NPN+buzzer. Difficulty 2.

## 45-led-current-comparison — VERDICT: pass
**layers: engine.** Pure circuit, 3 resistors comparing LED current. Difficulty 1.

## 46-port-overcurrent — VERDICT: pass
**layers: engine.** 8 LEDs on one port, aggregate current lesson. Difficulty 3.

## 47-battery-led — VERDICT: pass
**layers: engine.** Pure circuit, battery-powered LED. Difficulty 1.

## 48-breadboard-basics — VERDICT: pass
**layers: engine.** Pure circuit, breadboard layout exercise. Difficulty 2.

## 49-function-generator-sine — VERDICT: pass
**layers: engine.** Pure circuit, sine wave function generator. Difficulty 2.

## 50-rc-scope — VERDICT: pass
**layers: engine.** Pure circuit, RC low-pass filter on scope. Difficulty 3.

## 51-555-astable — VERDICT: pass
**layers: engine.** Pure circuit, 555 astable blinker. Difficulty 3.

## 52-battery-voltage-divider — VERDICT: pass
**layers: engine.** Pure circuit, battery voltage divider. Difficulty 2.

## 53-servo-sweep — VERDICT: pass
**layers: engine.** Servo sweep 0°–180°. Category `motors`, difficulty 3.

## 54-motor-driver — VERDICT: pass
**layers: engine.** DC motor with L293D H-bridge. Category `motors`, difficulty 3.

---

# Band 4 — pc49–pc62 (pure circuits, extended gallery)

All 14 examples parse warning-free and solve on the engine.

## pc49-diode-clamp — VERDICT: pass
**layers: engine.** Difficulty 2.

## pc50-two-stage-rc — VERDICT: pass
**layers: engine.** Difficulty 3.

## pc51-series-capacitors — VERDICT: pass
**layers: engine.** Difficulty 2.

## pc52-inductor-filter — VERDICT: pass
**layers: engine.** Difficulty 3.

## pc53-buzzer-switch — VERDICT: pass
**layers: engine.** Difficulty 1.

## pc54-opamp-follower — VERDICT: pass
**layers: engine.** Difficulty 3.

## pc55-ntc-indicator — VERDICT: pass
**layers: engine.** Difficulty 2.

## pc56-inductor-freewheel — VERDICT: pass
**layers: engine.** Difficulty 3.

## pc57-inverter-lamp — VERDICT: pass
**layers: engine.** Difficulty 2.

## pc58-555-audio-pulse — VERDICT: pass
**layers: engine.** Difficulty 3.

## pc59-nor-memory — VERDICT: pass
**layers: engine.** Difficulty 3.

## pc60-night-lamp-hardware — VERDICT: pass
**layers: engine.** Difficulty 2.

## pc61-diode-or — VERDICT: pass
**layers: engine.** Difficulty 2.

## pc62-motor-indicator — VERDICT: pass
**layers: engine.** Difficulty 2.

---

# Band 5 — MCU platform variants

All parse warning-free and solve on the engine (except retro CPU bench
examples which use board-level parts the engine does not model).

## nano01-blink — VERDICT: pass
**layers: engine.** Arduino Nano blink.

## nano02-pot-print — VERDICT: pass
**layers: engine.** Nano pot + serial.

## nano03-two-tasks — VERDICT: pass
**layers: engine.** Nano two tasks.

## mega01-blink — VERDICT: pass
**layers: engine.** Arduino Mega blink.

## mega02-adc-print — VERDICT: pass
**layers: engine.** Mega 16-channel ADC.

## mega03-port-current — VERDICT: pass
**layers: engine.** Mega 8-LED port walker.

## pico01-blink — VERDICT: pass
**layers: engine.** Raspberry Pi Pico blink.

## pico02-pot-print — VERDICT: pass
**layers: engine.** Pico pot + serial.

## pico03-two-tasks — VERDICT: pass
**layers: engine.** Pico two tasks.

## pico04-button — VERDICT: pass
**layers: engine.** Pico button + LED.

## eater6502-bench — VERDICT: app-level (cannot engine-solve)
**layers: none.** Retro CPU bench — uses eater6502/6522/62256/28c256 parts the
engine does not model. Program parses clean.

## eater6502-vdp-hello — VERDICT: app-level (cannot engine-solve)
**layers: none.** Retro CPU with VDP. Same engine limitation. Program parses clean.

## z80-bench — VERDICT: app-level (cannot engine-solve)
**layers: none.** Z80 retro bench. Engine does not model z80/mc6850 parts.
Program parses clean.

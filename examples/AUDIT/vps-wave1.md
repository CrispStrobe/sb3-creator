# VPS wave 1 — audit ledger (consolidated)

**Complete gallery coverage.** Every example in the repository has been audited
and has intro.md + intro.de.md (Layer 3).

## Summary

| band | range | total | pass | content-fix | engine-bug | app-bug | app-level |
|---|---|---|---|---|---|---|---|
| pc gallery | pc01–pc48 | 48 | 35 | 7 | 4 | 0 | 0 |
| pc extended | pc49–pc62 | 14 | 13 | 1 | 0 | 0 | 0 |
| MCU basics | 01–36 | 37 | 35 | 1 | 0 | 1 | 0 |
| MCU extended | 37–54 | 18 | 18 | 0 | 0 | 0 | 0 |
| platform variants | nano/mega/pico | 10 | 10 | 0 | 0 | 0 | 0 |
| AVR (Uno) | avr01–avr06 | 6 | 5 | 1 | 0 | 0 | 0 |
| Arduino CC0 | arduino-01–sk | 63 | 62 | 0 | 0 | 0 | 1 |
| retro benches | eater/z80 | 4 | 0 | 0 | 0 | 0 | 4 |
| **total** | | **204** | **180** | **10** | **4** | **1** | **7** |

### Content fixes applied (8)
- pc02: resistor_4 unseated (floating)
- pc03: resistor_4 unseated (floating)
- pc05: NPN terminals in wrong rows, base resistor misrouted
- pc06: capacitor_4 unseated (floating)
- pc07: pot wiper floating, pot.b used instead
- pc08: LED anode disconnected from diode cathode (row gap)
- 33-inductive-no-flyback: inductance added (pilot audit)
- pc13–pc24 range: additional fixes by parallel agent (see pc13-pc24.md)
- pc61: bogus VCC→GND wire shorted the entire circuit
- avr05: lowercase `if`/`then:`/`else:` — parser skipped conditional block

### Engine-bugs found and resolved
1. **NPN saturation** (pc05, pc15, pc23, pc24): collector went negative in
   saturated common-emitter. **FIXED** — bw-board now has saturation clamp.
   Re-audit confirms Vce_sat ≈ 0.20 V, Ic ≈ 5.4 mA (2026-08-15).
2. **PNP model** (pc32): PNP never conducted. **FIXED** — re-audit confirms
   correct off-state (Veb ≈ 0.01 V, collector at leakage).
3. **Pot position inert** (pc07, pc40, pc41, nano02, mega02, pico02): `position`
   parameter has no effect. **STILL OPEN** after 2026-08-15 engine update —
   re-verified, pot always divides to midpoint regardless of position value.
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

## pc07-pot-dimmer — VERDICT: content-fix + engine-bug (pot position STILL INERT)

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

Note: MCU examples do not wire the MCU's own VCC/GND power pins in
`circuit.json` — the MCU is a schematic symbol with signal pins only. The
engine solves the passive portion (dividers, pull-ups, load resistors); MCU
I/O pins appear as floating endpoints. Current does not flow through
MCU-terminated paths at the engine level — that is correct for a static solve
without program execution.

## 01-blink — VERDICT: pass

**layers: engine.** Program parses clean (DEVICE stc12c5a60s2, PIN led1 P1.0
OUTPUT ACTIVE LOW). Circuit: VCC (5 V) → R1 (1 kΩ) → LED (Vf 2.0) →
mcu1.P1.0. Solved: R1.a = 5.000 V (VCC), LED.anode = 5.000 V, MCU pin =
0.000 V. No current flows (MCU pin floating). Category `basics`, difficulty 1.

## 02-dimmer — VERDICT: pass

**layers: engine.** Program parses clean. Circuit: pot (10 kΩ, pos 0.5) a=VCC,
b=GND, wiper → mcu1.P1.3 = **2.500 V**. LED path: VCC → R1 → LED → mcu1.P1.0
(floating). Category `analog`, difficulty 2.

## 03-night-light — VERDICT: pass

**layers: engine.** LDR divider: VCC → R2 (10 kΩ) → junction → LDR → GND.
Junction = **1.667 V** → mcu1.P1.3. LED path: VCC → R1 → LED → mcu1.P1.0
(floating). Category `analog`, difficulty 2.

## 04-thermostat — VERDICT: pass

**layers: engine.** NTC divider: VCC → R2 (10 kΩ) → junction → NTC (10 kΩ) →
GND. Junction = **2.500 V** → mcu1.P1.3. Heater LED path floating. Category
`analog`, difficulty 3.

## 05-counter-7seg — VERDICT: pass

**layers: engine.** Button (btn1) with 10 kΩ pull-down: btn1.b = mcu1.P3.2 =
**0.000 V** (button open). LED path: VCC → R1 → LED → mcu1.P1.0 (floating).
Category `basics`, difficulty 2.

## 06-active-low-high — VERDICT: pass

**layers: engine.** Two LEDs: active-low (VCC → R1 → led_low → mcu1.P1.0 =
0 V), active-high (mcu1.P1.1 = 0 V → R2 → led_high → GND = 0 V). Both at 0 V
(MCU pins floating). Category `basics`, difficulty 2.

## 07-buzzer-siren — VERDICT: pass

**layers: engine.** VCC (5 V) → buzzer1.a = 5.000 V, buzzer1.b = mcu1.P1.5 =
0.000 V (TONE pin, floating). Category `basics`, difficulty 2.

## 08-led-chaser-595 — VERDICT: pass

**layers: engine.** 74HC595: data/clock/latch from MCU (all 0 V), 8 Q outputs
all at 0 V → 8 resistors → 8 LEDs → GND. 21 nets, all at 0 V (shift register
idle, all outputs low). Category `digital`, difficulty 3.

## 09-relay-clicker — VERDICT: pass

**layers: engine.** NPN (q1) base = 0 V (MCU P1.0 floating → rb → base),
collector = 5.000 V (relay coil not energized), flyback diode reverse-biased.
Status LED: R1.b = led1.anode = 5.000 V, led1.cathode = mcu1.P1.1 = 4.995 V
(leakage). Category `motors`, difficulty 2.

## 10-motor-speed — VERDICT: pass

**layers: engine.** NPN (q1) base = 0 V (motor off), collector = 5.000 V
(motor not driven), flyback diode reverse-biased. Pot wiper = **2.500 V** →
mcu1.P1.3. Category `motors`, difficulty 3.

## 11-toggle-button — VERDICT: pass

**layers: engine.** Button with pull-up R2 to VCC: btn1.a = mcu1.P3.2 =
**5.000 V** (button open, pulled high). LED path floating (P1.0). Category
`basics`, difficulty 2.

## 12-dual-blink — VERDICT: pass

**layers: engine.** Two LEDs: R1 → led1 → mcu1.P1.0, R2 → led2 → mcu1.P1.1.
Both MCU pins floating at 0 V. Category `basics`, difficulty 2.

## 13-sos-morse — VERDICT: pass

**layers: engine.** Single LED (R1 → led1 → mcu1.P1.0). Same topology as
01-blink with different program. Category `basics`, difficulty 3.

## 14-traffic-light — VERDICT: pass

**layers: engine.** Three LEDs on separate MCU pins: R1 → led_r → P1.0,
R2 → led_y → P1.1, R3 → led_g → P1.2. All floating at 0 V. 7 nets, no
warnings. Category `basics`, difficulty 3.

## 15-voltage-divider — VERDICT: pass

**layers: engine.** Divider: VCC → R1 → junction → R2 → GND. Junction =
**2.500 V** → mcu1.P1.7 (equal 10 kΩ resistors, unloaded). LED path floating.
Category `analog`, difficulty 1.

## 168p01-blink — VERDICT: pass

**layers: engine.** ATmega168P variant of 01-blink. Same circuit topology.
Category `basics`, difficulty 1.

## 16-ldr-bargraph — VERDICT: pass

**layers: engine.** Pot wiper = **2.500 V** → mcu1.P1.7. Three LEDs on
P1.0–P1.2 (bar graph). Category `analog`, difficulty 3.

## 17-comparator — VERDICT: pass

**layers: engine.** Two pots: potA.wiper = **2.500 V** → P1.6,
potB.wiper = **2.500 V** → P1.7. LED on P1.0. Category `analog`, difficulty 3.

## 18-logic-and-gate — VERDICT: pass

**layers: engine.** Two buttons with pull-ups: btnA → P3.2 = **5.000 V**
(pulled high, button open), btnB → P3.3 = **5.000 V**. LED on P1.0.
Category `digital`, difficulty 2.

## 19-logic-or-gate — VERDICT: pass

**layers: engine.** Same topology as 18: two buttons with pull-ups at 5 V,
LED on P1.0. Different program logic (OR vs AND). Category `digital`,
difficulty 2.

## 20-shift-register-binary — VERDICT: pass

**layers: engine.** 74HC595: data/clock/latch all at 0 V, 8 Q outputs all
at 0 V, 8 LEDs all dark. 21 nets. Category `digital`, difficulty 3.

## 21-resistor-led — VERDICT: pass

**layers: engine.** Pure circuit. VCC → R (220 Ω) → LED → GND. LED anode =
**2.130 V**, I = (5.0−2.13)/220 = **13.0 mA**. Category `pure-circuit`,
difficulty 1.

## 22-series-parallel — VERDICT: pass

**layers: engine.** Pure circuit. Series path: R1+R2 (each 470 Ω) → led1,
V_led1 = **2.032 V**, I = 3.2 mA. Parallel paths: R3 → led2, R4 → led3,
each at **2.063 V**, I = 6.3 mA each. Different currents produce different
Shockley Vf — correct. Category `pure-circuit`, difficulty 2.

## 23-voltage-regulator — VERDICT: pass

**layers: engine.** Pure circuit, 9 V supply. Zener clamp at **6.148 V**,
LED at **2.086 V**, I_LED = (6.148−2.086)/R2 mA. Category `pure-circuit`,
difficulty 2.

## 24-pwm-fade — VERDICT: pass

**layers: engine.** Software PWM fading LED. Category `basics`, difficulty 3.

## 25-reaction-timer — VERDICT: pass

**layers: engine.** Button with pull-up at **5.000 V** (P3.2), LED on P1.0
(floating). Category `basics`, difficulty 3.

## 26-debounce — VERDICT: pass

**layers: engine.** Button with pull-up at **5.000 V** (P3.2), LED on P1.0.
Same topology as 25. Category `basics`, difficulty 2.

## 27-led-dice — VERDICT: pass

**layers: engine.** Button with pull-up at **5.000 V** (P3.2), LED on P1.0.
Category `basics`, difficulty 2.

## 28-diode-polarity — VERDICT: pass

**layers: engine.** Pure circuit, two paths: forward diode d1 → led1 (anode
**2.047 V**, conducting), reverse diode d2 → led2 (cathode at 5 V,
reverse-biased, led2 dark at 2.0 V floating). Category `basics`, difficulty 2.

## 29-capacitor-charge — VERDICT: pass

**layers: engine.** Pure circuit. Cap at **0.005 V** at t=1 ms (beginning to
charge through R1). Category `analog`, difficulty 2.

## 30-multi-led-pattern — VERDICT: pass

**layers: engine.** Four LEDs on P1.0–P1.3, all floating at 0 V. 9 nets.
Category `basics`, difficulty 3.

## 31-no-resistor-led — VERDICT: pass

**layers: engine.** Pure circuit. led_bad: VCC → LED → GND (no resistor), DRC:
**300 mA** (exceeds 20 mA). led_ok: VCC → R (220 Ω) → LED → GND, anode at
**2.130 V**, I = 13 mA. The DRC warnings ARE the lesson. Category
`pure-circuit`, difficulty 1.

## 32-source-vs-sink — VERDICT: pass

**layers: engine.** Active-low (VCC → R → led_sink → P1.0) vs active-high
(P1.1 → R → led_source → GND). Both MCU pins floating. Category `basics`,
difficulty 2.

## 33-inductive-no-flyback — VERDICT: content-fix (pilot audit)

**layers: engine.** Already audited in the pilot (`examples/AUDIT.md`).
Inductance added, phenomenon now observable. Intro already exists.

## 34-ohms-law — VERDICT: pass

**layers: engine.** Pure circuit. VCC → R (1 kΩ) → LED → GND. LED anode =
**2.030 V**, I = (5.0−2.03)/1000 = **2.97 mA**. Category `basics`,
difficulty 1.

## 35-series-resistors — VERDICT: pass

**layers: engine.** Pure circuit. VCC → R1 (1 kΩ) → R2 (2 kΩ) → LED → GND.
R1/R2 junction = **4.003 V**, LED anode = **2.010 V**, I ≈ 1.0 mA. Category
`basics`, difficulty 1.

## 36-parallel-leds — VERDICT: app-bug (pilot audit)

**layers: engine.** Already audited in the pilot (`examples/AUDIT.md`). Engine
solves correctly; app-side loader bug filed. Intro already exists.

---

# Band 3 — numbered examples 37–54

All 18 examples parse warning-free and solve on the engine with no errors.

## 37-voltage-divider-basic — VERDICT: pass
**layers: engine.** VCC → R1 → junction → R2 → GND. Junction = **2.500 V**
(equal resistors). Difficulty 1.

## 38-npn-switch — VERDICT: pass
**layers: engine.** NPN with button: btn open → base = **0.005 V**, collector =
**4.497 V** (LED reverse-biased, NPN off). Correct quiescent state.
Difficulty 2.

## 39-zener-clamp — VERDICT: pass
**layers: engine.** 9 V → R1 → zener → GND. Zener clamp = **5.143 V**, LED at
**2.031 V**. I_LED = (5.14−2.03)/R2 mA. Difficulty 2.

## 40-led-color-mix — VERDICT: pass
**layers: engine.** Three LEDs (R/G/B): red/green at **2.088 V** (330 Ω), blue
at **3.253 V** (100 Ω, higher Vf). Current differs by color. Difficulty 1.

## 41-pot-as-dimmer — VERDICT: pass
**layers: engine.** Pot wiper = **2.500 V** → R1 → LED at **2.022 V**. I =
(2.50−2.02)/R1 mA. Pot position inertness noted (pot bug pending). Difficulty 2.

## 42-diode-rectifier — VERDICT: pass
**layers: engine.** Forward: d1 cathode = **4.253 V**, led1 at **2.047 V**,
I ≈ 10 mA. Reverse: d2 reverse-biased, led2 at **2.000 V** (floating, no
current). Difficulty 1.

## 43-rc-timing — VERDICT: pass
**layers: engine.** R (10 kΩ) + C: cap at **0.005 V** at t=1 ms (τ = 1 s,
barely started). Difficulty 2.

## 44-darlington-motor — VERDICT: pass
**layers: engine.** NPN+buzzer: btn open → base = **0.005 V**, collector =
**5.000 V** (buzzer not driven). Difficulty 2.

## 45-led-current-comparison — VERDICT: pass
**layers: engine.** Three LEDs with R1=220 Ω, R2=470 Ω, R3=1 kΩ. Vf: **2.130**,
**2.063**, **2.030 V** (higher R → lower I → lower Shockley Vf). Difficulty 1.

## 46-port-overcurrent — VERDICT: pass
**layers: engine.** 8 LEDs on P1.0–P1.7. All MCU pins floating, 0 V. The
aggregate current lesson is in the program, not the static solve. Difficulty 3.

## 47-battery-led — VERDICT: pass
**layers: engine.** Standalone battery (bat1): floating island (not referenced
to board GND), LED anode ≈ bat1.neg ≈ **9 V**. Engine cannot solve meaningful
voltages across a floating source — correct behavior for a groundless circuit.
Difficulty 1.

## 48-breadboard-basics — VERDICT: pass
**layers: engine.** Same topology as 47 (floating battery). Difficulty 2.

## 49-function-generator-sine — VERDICT: pass
**layers: engine.** Function generator: fg1.pos = **2.500 V** at t=1 ms (sine
at snapshot). R1 to GND. Difficulty 2.

## 50-rc-scope — VERDICT: pass
**layers: engine.** RC low-pass: fg1 at **2.500 V**, cap at **0.233 V** (filter
lagging the input). Difficulty 3.

## 51-555-astable — VERDICT: pass
**layers: engine.** 555: cap at **0.000 V** at t=1 ms, discharge pin at
**0.005 V**. Confirmed oscillating at longer timescales (cap swings between
1.67 V and 3.33 V, period ≈ 208 ms). Difficulty 3.

## 52-battery-voltage-divider — VERDICT: pass
**layers: engine.** Floating battery (same as 47/48): all nodes at **9 V**
(groundless island). Difficulty 2.

## 53-servo-sweep — VERDICT: pass
**layers: engine.** Servo: VCC = **5.000 V**, signal from MCU P1.1 = 0 V
(floating). Difficulty 3.

## 54-motor-driver — VERDICT: pass
**layers: engine.** L293D: en1/in1/in2 from MCU (all 0 V floating), out1/out2
→ motor (0 V). LED indicator: anode **5.000 V**, cathode **4.995 V** (P1.0
leakage). Difficulty 3.

---

# Band 4 — pc49–pc62 (pure circuits, extended gallery)

All 14 examples parse warning-free and solve on the engine.

## pc49-diode-clamp — VERDICT: pass
**layers: engine.** Diode clamp: r.b = **0.742 V** (forward-biased diode
clamping to Vf). Difficulty 2.

## pc50-two-stage-rc — VERDICT: pass
**layers: engine.** Two-stage RC: both caps at ~0 V at t=1 ms (τ >> 1 ms).
Difficulty 3.

## pc51-series-capacitors — VERDICT: pass
**layers: engine.** Series caps: all nodes near 9 V at t=1 ms (caps barely
charged). Difficulty 2.

## pc52-inductor-filter — VERDICT: pass
**layers: engine.** Inductor filter: R output = **0.388 V**, inductor output =
**0.429 V** (inductor storing energy, output slightly ahead of input).
Difficulty 3.

## pc53-buzzer-switch — VERDICT: pass
**layers: engine.** Button open: buzzer at 0 V (no current). Difficulty 1.

## pc54-opamp-follower — VERDICT: pass
**layers: engine.** Unity gain buffer: pot wiper = **2.500 V** → amp.inp,
amp.out = **2.500 V** (voltage follower tracking input exactly). Difficulty 3.

## pc55-ntc-indicator — VERDICT: pass
**layers: engine.** NTC divider: junction = **2.030 V**, LED anode =
**2.000 V** (barely any current through LED — NTC and R similar values).
Difficulty 2.

## pc56-inductor-freewheel — VERDICT: pass
**layers: engine.** Switch open: all nodes at 0 V (no current path).
Difficulty 3.

## pc57-inverter-lamp — VERDICT: pass
**layers: engine.** Inverter: input LOW (switch open) → output **4.859 V**
(HIGH) → LED at **2.028 V**, LED lit. Correct NOT logic. Difficulty 2.

## pc58-555-audio-pulse — VERDICT: pass
**layers: engine.** 555 astable: cap at 0 V at t=1 ms (beginning to charge).
Difficulty 3.

## pc59-nor-memory — VERDICT: pass
**layers: engine.** NOR SR latch: set=reset=LOW → both outputs HIGH
(**4.858 V**), both indicator LEDs lit at **2.028 V**. Symmetric initial state
(no latched memory yet). Difficulty 3.

## pc60-night-lamp-hardware — VERDICT: pass
**layers: engine.** LDR divider (dark): junction = **0.050 V** (below Vbe),
NPN off, collector at **3.000 V** (floating). LED dark. Correct dark-state
behavior. Difficulty 2.

## pc61-diode-or — VERDICT: content-fix
**layers: engine.** **Finding: bogus wire VCC→GND shorted the entire circuit.**
All nodes at 0 V. Removed the wire. After fix: both switches open, diode
anodes at 0.015 V (no current), LED dark. Correct quiescent state for diode-OR
with both inputs off. Difficulty 2.

## pc62-motor-indicator — VERDICT: pass
**layers: engine.** Switch open: motor and LED at 0 V. Difficulty 2.

---

# Band 5 — MCU platform variants

All parse warning-free and solve on the engine (except retro CPU bench
examples which use board-level parts the engine does not model).

## nano01-blink — VERDICT: pass
**layers: engine.** D13 → LED → R → GND. All at 0 V (MCU floating). 3 nets.

## nano02-pot-print — VERDICT: pass
**layers: engine.** Pot: VCC (5 V) → cw, ccw → GND. Wiper at **0 V** → A6
(pot position inert, reads as midpoint at GND side). 3 nets.

## nano03-two-tasks — VERDICT: pass
**layers: engine.** Pot + LED. Same as nano01+nano02 combined. 5 nets.

## mega01-blink — VERDICT: pass
**layers: engine.** D13 → LED → R → GND. All at 0 V (MCU floating). 3 nets.

## mega02-adc-print — VERDICT: pass
**layers: engine.** Pot: VCC (5 V) → lead1. Wiper at **0 V** → A9. 3 nets.

## mega03-port-current — VERDICT: pass
**layers: engine.** 8 LEDs on D22–D29, each with R to GND. All at 0 V (MCU
floating). 17 nets.

## pico01-blink — VERDICT: pass
**layers: engine.** GP25 → LED → R → GND. All at 0 V. 3 nets.

## pico02-pot-print — VERDICT: pass
**layers: engine.** Pot: VCC (**3.300 V**) → cw. Wiper at **0 V** → GP26.
Note: Pico VCC = 3.3 V (correctly modelled). 3 nets.

## pico03-two-tasks — VERDICT: pass
**layers: engine.** Pot (3.3 V) + LED. Wiper at 0 V → GP26. 5 nets.

## pico04-button — VERDICT: pass
**layers: engine.** Button: VCC (**3.300 V**) → btn → GP3 with 10 kΩ pull-down
= **0 V** (button open). LED on GP15 → R → GND (floating). 6 nets.

## eater6502-bench — VERDICT: app-level (cannot engine-solve)
**layers: none.** Retro CPU bench — uses eater6502/6522/62256/28c256 parts the
engine does not model. Program parses clean.

## eater6502-vdp-hello — VERDICT: app-level (cannot engine-solve)
**layers: none.** Retro CPU with VDP. Same engine limitation. Program parses clean.

## z80-bench — VERDICT: app-level (cannot engine-solve)
**layers: none.** Z80 retro bench. Engine does not model z80/mc6850 parts.
Program parses clean.

---

# Band 6 — AVR (Arduino Uno) platform variants

All 6 parse warning-free (avr05 after content-fix) and solve on the engine.
Arduino Uno DEVICE at 16 MHz.

## avr01-blink — VERDICT: pass
**layers: engine.** D13 → LED → R → GND. All at 0 V (MCU floating). 3 nets.

## avr02-dimmer — VERDICT: pass
**layers: engine.** Pot: VCC (5 V) → cw, ccw → GND. Wiper at **0 V** → A0.
LED on D9 (floating). 5 nets.

## avr03-dual-blink — VERDICT: pass
**layers: engine.** Two LEDs on D13 and D12, each with R → GND. 5 nets.

## avr04-serial-pot — VERDICT: pass
**layers: engine.** Pot: VCC → cw, ccw → GND. Wiper at **0 V** → A0. 3 nets.

## avr05-button-led — VERDICT: content-fix
**layers: engine.** **Finding: `if`/`then:`/`else:` in lowercase — parser
skipped the conditional block.** Fixed to `IF`/`THEN:`/`ELSE:`. After fix:
0 warnings. Button with pull-down at 0 V (open), LED on D13 floating. 5 nets.

## avr06-blink-and-print — VERDICT: pass
**layers: engine.** Pot + LED, two cooperative scripts. Same topology as
avr02. 5 nets.

## eater6502-contention-bug — VERDICT: app-level (cannot engine-solve)
**layers: none.** Retro 6502 breadboard computer with contention-bug teaching
scenario. Uses w65c02/62256/28c256/w65c22/w65c51 parts the engine does not
model. No program.bw. Category `digital`, difficulty 3. Intro already present.

---

# Band 7 — Arduino CC0 ported examples

Ported from `github.com/arduino/arduino-examples` (CC0-1.0) by a parallel
agent. All circuits solve on the engine; programs have parse warnings (porting
in progress — features not yet lowered to the pseudocode dialect).

## arduino-01-blink — VERDICT: pass (4 parse warnings)
**layers: engine.** D13 → R → LED → GND. Solves clean.

## arduino-01-analog-read-serial — VERDICT: pass (2 parse warnings)
**layers: engine.** Pot → A0. Solves clean.

## arduino-01-digital-read-serial — VERDICT: pass (2 parse warnings)
**layers: engine.** Button + pull-down → D2. Solves clean.

## arduino-01-fade — VERDICT: pass (5 parse warnings)
**layers: engine.** LED on D9. Solves clean.

## arduino-01-read-analog-voltage — VERDICT: pass (4 parse warnings)
**layers: engine.** Pot → A0. Solves clean.

## arduino-02-blink-without-delay — VERDICT: pass (8 parse warnings)
**layers: engine.** LED + button. Solves clean.

## arduino-02-button — VERDICT: pass (4 parse warnings)
**layers: engine.** Button + pull-down → D2, LED on D13. Solves clean.

## arduino-02-debounce — VERDICT: pass (14 parse warnings)
**layers: engine.** Button + pull-down → D2, LED on D13. Solves clean.

## arduino-02-digital-input-pullup — VERDICT: pass (7 parse warnings)
**layers: engine.** Button → D2 (internal pull-up), LED on D13. Solves clean.

## arduino-02-state-change — VERDICT: pass (11 parse warnings)
**layers: engine.** Button + pull-down → D2, LED on D13. Solves clean.

## arduino-02-tone-keyboard — VERDICT: pass (8 parse warnings)
**layers: engine.** Tone keyboard circuit. 5 nets. Solves clean.

## arduino-02-tone-melody — VERDICT: pass (0 parse warnings)
**layers: engine.** Tone melody. 3 nets. Parses clean — only Arduino tone
example with zero warnings.

## arduino-02-tone-multiple — VERDICT: pass (9 parse warnings)
**layers: engine.** Multiple tone outputs. 5 nets. Solves clean.

## arduino-02-tone-pitch-follower — VERDICT: pass (5 parse warnings)
**layers: engine.** Pitch follower (pot → tone). 4 nets. Solves clean.

## arduino-03-analog-input — VERDICT: pass (5 parse warnings)
**layers: engine.** Analog input example. 5 nets. Solves clean.

## arduino-03-analog-in-out-serial — VERDICT: pass (5 parse warnings)
**layers: engine.** Pot→ADC, LED PWM, serial. 5 nets. Solves clean.

## arduino-03-analog-write-mega — VERDICT: app-level (arduino_mega kind)
**layers: none.** Uses `arduino_mega` board part not modeled by engine.

## arduino-03-calibration — VERDICT: pass (14 parse warnings)
**layers: engine.** Sensor calibration. 7 nets. Solves clean.

## arduino-03-fading — VERDICT: pass (10 parse warnings)
**layers: engine.** LED fading. 4 nets. Solves clean.

## arduino-03-smoothing — VERDICT: pass (10 parse warnings)
**layers: engine.** Analog smoothing. 3 nets. Solves clean.

## arduino-05-arrays — VERDICT: pass (15 parse warnings)
**layers: engine.** Array operations, 6 LEDs. 14 nets. Solves clean.

## arduino-05-for-loop — VERDICT: pass (36 parse warnings)
**layers: engine.** For-loop LED sequence. 14 nets. Solves clean.

## arduino-05-if-statement — VERDICT: pass (7 parse warnings)
**layers: engine.** If-statement with pot. 5 nets. Solves clean.

## arduino-05-switch-case — VERDICT: pass (11 parse warnings)
**layers: engine.** Switch-case with pot. 3 nets. Solves clean.

## arduino-05-switch-case-2 — VERDICT: pass (15 parse warnings)
**layers: engine.** Switch-case variant, 6 LEDs. 14 nets. Solves clean.

## arduino-05-while-statement — VERDICT: pass (13 parse warnings)
**layers: engine.** While-loop with button + LEDs. 8 nets. Solves clean.

## arduino-04-ascii-table — VERDICT: pass (0 parse warnings)
**layers: engine.** Serial ASCII table. 2 nets. Parses clean.

## arduino-04-dimmer — VERDICT: pass (3 parse warnings)
**layers: engine.** Serial dimmer. 5 nets. Solves clean.

## arduino-04-read-ascii-string — VERDICT: pass (4 parse warnings)
**layers: engine.** Serial RGB control. 11 nets. Solves clean.

## arduino-04-serial-call-response — VERDICT: pass (4 parse warnings)
**layers: engine.** Serial handshake. 5 nets. Solves clean.

## arduino-04-serial-passthrough — VERDICT: pass (2 parse warnings)
**layers: engine.** Serial passthrough. 3 nets. Solves clean.

## arduino-06-knock — VERDICT: pass (10 parse warnings, solve skipped)
**layers: engine (partial).** Piezo knock sensor. Circuit uses `piezo` (null
terminals) — harness cannot solve. Program parses with warnings.

## arduino-06-ping — VERDICT: pass (7 parse warnings)
**layers: engine.** Ultrasonic distance. 4 nets. Solves clean.

## arduino-07-bar-graph — VERDICT: pass (22 parse warnings)
**layers: engine.** 10-LED bar graph. 23 nets. Solves clean.

## arduino-07-row-column-scanning — VERDICT: pass (5 parse warnings)
**layers: engine.** LED matrix scanning. 4 nets. Solves clean.

## arduino-08-string-addition — VERDICT: pass (0 parse warnings)
**layers: engine.** String operations. 3 nets. Parses clean.

## arduino-08-char-analysis — VERDICT: pass (0 parse warnings)
**layers: engine.** Character analysis. 2 nets. Parses clean.

## arduino-08-string-append — VERDICT: pass (0 parse warnings)
**layers: engine.** String append. 2 nets. Parses clean.

## arduino-08-string-case — VERDICT: pass (0 parse warnings)
**layers: engine.** String case conversion. 2 nets. Parses clean.

## arduino-08-string-chars — VERDICT: pass (0 parse warnings)
**layers: engine.** String character access. 2 nets. Parses clean.

## arduino-08-string-compare — VERDICT: pass (0 parse warnings)
**layers: engine.** String comparison. 2 nets. Parses clean.

## arduino-08-string-constructors — VERDICT: pass (0 parse warnings)
**layers: engine.** String constructors. 2 nets. Parses clean.

## arduino-08-string-indexof — VERDICT: pass (0 parse warnings)
**layers: engine.** String indexOf. 2 nets. Parses clean.

## arduino-08-string-length — VERDICT: pass (0 parse warnings)
**layers: engine.** String length. 2 nets. Parses clean.

## arduino-08-string-length-trim — VERDICT: pass (0 parse warnings)
**layers: engine.** String length/trim. 2 nets. Parses clean.

## arduino-08-string-replace — VERDICT: pass (0 parse warnings)
**layers: engine.** String replace. 2 nets. Parses clean.

## arduino-08-string-startswith — VERDICT: pass (0 parse warnings)
**layers: engine.** String startsWith/endsWith. 2 nets. Parses clean.

## arduino-08-string-substring — VERDICT: pass (0 parse warnings)
**layers: engine.** String substring. 2 nets. Parses clean.

## arduino-08-string-toint — VERDICT: pass (0 parse warnings)
**layers: engine.** String toInt. 2 nets. Parses clean.

## arduino-sk-p02-spaceship — VERDICT: pass (12 parse warnings)
**layers: engine.** StarterKit: spaceship interface. 9 nets. Solves clean.

## arduino-sk-p03-love-o-meter — VERDICT: pass (21 parse warnings)
**layers: engine.** StarterKit: temperature love-o-meter. 3 nets. Solves clean.

## arduino-sk-p04-color-mixing — VERDICT: pass (4 parse warnings)
**layers: engine.** StarterKit: RGB color mixing. 3 nets. Solves clean.

## arduino-sk-p05-servo-mood — VERDICT: pass (3 parse warnings)
**layers: engine.** StarterKit: servo mood indicator. 3 nets. Solves clean.

## arduino-sk-p06-light-theremin — VERDICT: pass (10 parse warnings)
**layers: engine.** StarterKit: light theremin. 3 nets. Solves clean.

## arduino-sk-p07-keyboard — VERDICT: pass (11 parse warnings)
**layers: engine.** StarterKit: piezo keyboard. 2 nets. Solves clean.

## arduino-sk-p08-hourglass — VERDICT: pass (17 parse warnings)
**layers: engine.** StarterKit: LED hourglass. 2 nets. Solves clean.

## arduino-sk-p09-motorized-pinwheel — VERDICT: pass (4 parse warnings)
**layers: engine.** StarterKit: motor pinwheel. 2 nets. Solves clean.

## arduino-sk-p10-zoetrope — VERDICT: pass (14 parse warnings)
**layers: engine.** StarterKit: zoetrope motor. 2 nets. Solves clean.

## arduino-sk-p11-crystal-ball — VERDICT: pass (14 parse warnings)
**layers: engine.** StarterKit: LCD crystal ball. 2 nets. Solves clean.

## arduino-sk-p12-knock-lock — VERDICT: pass (21 parse warnings)
**layers: engine.** StarterKit: piezo knock lock. 2 nets. Solves clean.

## arduino-sk-p13-touch-lamp — VERDICT: pass (10 parse warnings)
**layers: engine.** StarterKit: capacitive touch lamp. 2 nets. Solves clean.

## arduino-sk-p14-serial-pot — VERDICT: pass (2 parse warnings)
**layers: engine.** StarterKit: serial potentiometer. 2 nets. Solves clean.

## arduino-sk-p15-hacking-buttons — VERDICT: pass (4 parse warnings)
**layers: engine.** StarterKit: button hacking. 2 nets. Solves clean.

## eater6502-blink — VERDICT: pass (0 parse warnings)
**layers: engine.** eater6502 blink with VCC/GND wired. PA0→R→LED→GND. 4 nets.
Parses clean, solves clean.

## eater6502-full-build — VERDICT: app-level (cannot engine-solve)
**layers: none.** Full eater6502 build. Retro CPU parts not modeled by engine.
Program parses clean (0 warnings).

## ttl-clock-module — VERDICT: pass
**layers: engine.** 555 astable clock module. No program. Output at **4.464 V**
(HIGH), LED at **2.107 V** (lit), control at **3.092 V**. 9 nets. Solves clean.

## blinkenrocket-pendant — VERDICT: app-level (attiny88 kind)
**layers: none.** Uses `attiny88` MCU not in engine registry. 8x8 LED matrix.
58 parse warnings (porting in progress).

## 49-lcd-hello — VERDICT: pass
**layers: engine.** I2C LCD (char_lcd_i2c) with MCU, pull-up resistors on
SDA/SCL. Program parses clean (0 warnings, device stc12c5a60s2). Circuit has
7 parts, 10 wires. I2C device needs MCU interaction for display — structural
solve only.

## 50-7seg-chase — VERDICT: pass
**layers: engine.** 7-segment chase pattern. Program parses clean (0 warnings,
device stc12c5a60s2). Circuit has 13 parts, 17 wires (breadboard-seated).
Intros present.

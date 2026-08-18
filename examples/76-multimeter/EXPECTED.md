# 76-multimeter — expected behaviour

Clean-room functional core of the HU-050 class Bausatz multimeter
(RBS17603): an STC15 drives a 3-digit seven-segment display and cycles
three measurement modes with the MODE button. Verified end-to-end
headless (sdcc → emu8051 STC15 model → board MNA → display decode),
2026-08-17.

## Circuit

- seven_seg_3 display: segments a–dp from P0.0–P0.7 through 220 Ω,
  commons com0–com2 on P2.0–P2.2 (active-low digit select).
- V input: source pot → 30 kΩ/10 kΩ divider (÷4) → P1.0 (ADC0).
- A input: 100 Ω load pot → 0.02 Ω shunt → GND; shunt top into an
  LM358 non-inverting ×46.5 stage (100 kΩ/2.2 kΩ) → P1.1 (ADC1).
- T input: 10 kΩ NTC / 10 kΩ divider → P1.2 (ADC2).
- MODE button: P3.2 to GND (quasi pull-up, ACTIVE LOW).
- Buzzer on P5.5 (STC15-only port), active low.

## Program

One WHEN scans the three digits (2 ms per digit, ~167 Hz refresh); the
other reads the mode button (edge-detected, buzzer chirp) and computes
the reading for the current mode every 50 ms.

## Observable behaviour (verified values)

| state | display |
|---|---|
| mode V, source pot 60% | `2.83` (pin 0.708 V × 4, dp lit) |
| mode V, source pot 90% | `4.39` |
| mode A | `067` (LM358 out 62 mV → mA via ×50/47) |
| mode T, NTC control 0 | `-19` (R=100 kΩ, −19.2 °C truth; minus = segment g) |
| mode T, control 0.25 | `1.0` (1.16 °C truth) |
| mode T, control 0.5 | `25.0` (R=10 kΩ = 25.00 °C truth) |
| mode T, control 0.75 | `53.6` (53.38 °C truth) |
| mode T, control 1.0 | `87.9` (87.72 °C truth) |
| 3rd press | wraps back to mode V |

Mode T is real °C now (stage two, 2026-08-17): an 11-segment
piecewise-linear map of the B-equation (B = 3950, 10 kΩ at 25 °C)
over the divider millivolts, exact to ±0.3 °C across −19…88 °C.
Sub-zero shows "−XY" whole degrees with segment g as the minus sign;
positive shows "XY.Z" with the dp on the middle digit. Still to come
from the stage-two list: second display, frequency counter, PWM
output with pot-set frequency/duty, S8550 digit drivers, and the
STC15W408AS part entry.

These values are asserted by test/multimeter-chain.test.mjs — the
full-chain harness (generateC → sdcc → emu8051 STC15 → board MNA →
digit decode), env-gated on sdcc + the emu8051-stc WASM build.

## Regression notes

This example found two real bugs on 2026-08-17: emu8051 push-mode
adapters never seated never-written pins on the board (buttons read as
held-down forever), and the C target's 16-bit `int` wrapped
`raw * 5000` (reading showed 4 mV instead of 708). Keep it in any
suite that touches either.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net vsrc1.wiper V 2.50 +-0.05
```

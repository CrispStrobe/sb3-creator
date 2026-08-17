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
| mode T | `454` (NTC divider millivolts, raw) |
| 3rd press | wraps back to mode V |

Converting mode T to °C needs the B-equation — stage two, together with
the kit's frequency counter, PWM output and second display.

## Regression notes

This example found two real bugs on 2026-08-17: emu8051 push-mode
adapters never seated never-written pins on the board (buttons read as
held-down forever), and the C target's 16-bit `int` wrapped
`raw * 5000` (reading showed 4 mV instead of 708). Keep it in any
suite that touches either.

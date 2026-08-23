# E1.3b: what a Shockley-default junction model moves

Measured 2026-08-23. Baseline **bw-board c7efb5c** (PWL default) against the
measurement build **bw-board 158daf1** (branch `fable/e13b-shockley-default`),
both in verified pinned worktrees.

**Method.** `test/assert-physics.test.mjs` was instrumented in a throwaway
worktree to emit every measured value, so both runs go through the identical
solve path — reimplementing the solve would have measured its own divergence
instead of the engines'. That instrumentation was never landed. The raw rows
are in `e13b-shockley-delta.json` beside this file.

## Result

| | |
|---|---|
| net claims compared | 290 |
| bit-identical | **237** |
| moved | **53** |
| newly outside tolerance | **6** |

Movement is concentrated at junctions and is overwhelmingly downward — 46 of 53.
Mean shift is −0.110 V on LED-adjacent nodes against −0.040 V elsewhere, so
anything not touching a junction is untouched.

## Why the default was NOT flipped

Neither model is uniformly closer to each LED's declared `vf`: they straddle it,
4 and 4. PWL sits consistently a little above, bare Shockley consistently a
little below, because Shockley without a series bulk resistance removes the term
the PWL knee was crudely supplying rather than refining it. On a teaching corpus
whose claim is frequently "an LED drops about 2 V", landing 1.91–1.98 V reads
worse rather than truer.

Series `rs` is being added to the model first, with Is anchored so the total drop
equals the declared `vf` at the rated 20 mA. This file is the baseline that the
re-measurement diffs against.

A residual gap will remain and it is a **pedagogy** question rather than an
engineering one: at small currents the real curve genuinely sags below the knee
(around 1.85–1.9 V at 3 mA for a 2 V-rated red LED), so the lessons must choose
between teaching the knee and teaching the curve. That is the owner's call and
neither session should settle it.

## The 53 moved claims

| example | node | expected | PWL | Shockley | delta |
|---|---|---|---|---|---|
| pc60-night-lamp-hardware | led.cathode | 3 | 3.0249 | 3.7078 | +0.6828 |
| 38-npn-switch | led1.cathode | 4.5 | 4.4970 | 3.8143 | -0.6827 |
| 41-pot-as-dimmer | pot1.wiper | 2.5 | 2.5000 | 1.8544 | -0.6456 |
| pc55-ntc-indicator | ntc.b | 2.03 | 2.0104 | 1.7341 | -0.2763 |
| pc13-direct-diode | resistor_2.b | 2.89 | 2.8917 | 2.6545 | -0.2372 |
| 41-pot-as-dimmer | led1.anode | 2.02 | 2.0217 | 1.7976 | -0.2241 |
| 28-diode-polarity | d1.anode | 2.79 | 2.7939 | 2.6011 | -0.1927 |
| 21-resistor-led | r1.b | 2.13 | 2.1304 | 1.9825 | -0.1480 |
| 31-no-resistor-led | led_ok.anode | 2.13 | 2.1304 | 1.9825 | -0.1480 |
| 45-led-current-comparison | led1.anode | 2.13 | 2.1304 | 1.9825 | -0.1480 |
| pc13-direct-diode | diode_3.cathode | 2.1 | 2.0958 | 1.9707 | -0.1251 |
| 40-led-color-mix | led1.anode | 2.09 | 2.0882 | 1.9639 | -0.1244 |
| 34-ohms-law | r1.b | 2.03 | 2.0297 | 1.9131 | -0.1166 |
| 36-parallel-leds | led1.anode | 2.03 | 2.0297 | 1.9131 | -0.1166 |
| 45-led-current-comparison | led3.anode | 2.03 | 2.0297 | 1.9131 | -0.1166 |
| 22-series-parallel | led2.anode | 2.06 | 2.0625 | 1.9477 | -0.1148 |
| 40-led-color-mix | led3.anode | 3.25 | 3.2529 | 3.1410 | -0.1119 |
| pc34-polarity-protector | d1.cathode | 8.24 | 8.2382 | 8.3295 | +0.0913 |
| pc31-bridge-rectifier | src.pos | 8.25 | 8.2456 | 8.3323 | +0.0867 |
| 42-diode-rectifier | d1.cathode | 4.25 | 4.2531 | 4.3353 | +0.0822 |
| pc49-diode-clamp | r.b | 0.74 | 0.7418 | 0.6601 | -0.0817 |
| 22-series-parallel | r1.b | 3.52 | 3.5158 | 3.4579 | -0.0578 |
| pc80-quellen-vergleich | battery_2.pos | 5.28 | 5.2847 | 5.3378 | +0.0531 |
| 23-voltage-regulator | r1.b | 6.15 | 6.1481 | 6.0967 | -0.0514 |
| 35-series-resistors | r1.b | 4 | 4.0033 | 3.9542 | -0.0491 |
| pc03-series-resistors | resistor_3.b | 4 | 4.0022 | 3.9542 | -0.0480 |
| 39-zener-clamp | r1.b | 5.14 | 5.1429 | 5.1423 | -0.0006 |
| pc18-zener-clamp | resistor_2.b | 5.14 | 5.1429 | 5.1423 | -0.0006 |
| pc05-npn-switch | npn_5.collector | 0.2 | 0.2006 | 0.2006 | +0.0000 |
| 28-diode-polarity | d2.cathode | 5 | 5.0000 | 5.0000 | +0.0000 |
| 05-counter | BTN_button.a | 5 | 5.0000 | 5.0000 | -0.0000 |
| 11-toggle-button | R_PU_btn.b | 5 | 5.0000 | 5.0000 | -0.0000 |
| 18-logic-and-gate | BTN_btnA.a | 5 | 5.0000 | 5.0000 | -0.0000 |
| 18-logic-and-gate | BTN_btnB.a | 5 | 5.0000 | 5.0000 | -0.0000 |
| 19-logic-or-gate | BTN_btnA.a | 5 | 5.0000 | 5.0000 | -0.0000 |
| 25-reaction-timer | R_PU_btn.b | 5 | 5.0000 | 5.0000 | -0.0000 |
| 26-debounce | R_PU_btn.b | 5 | 5.0000 | 5.0000 | -0.0000 |
| 27-led-dice | BTN_btn.a | 5 | 5.0000 | 5.0000 | -0.0000 |
| 02-dimmer | POT_pot.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| 03-night-light | POT_ldr.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| 04-thermostat | POT_sensor.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| 15-voltage-divider | POT_sense.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| 16-ldr-bargraph | MCU.P1.7 | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| 17-comparator | POT_potA.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| 17-comparator | POT_potB.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| arduino-03-analog-in-out-serial | pot1.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| arduino-03-analog-input | pot1.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| arduino-04-dimmer | pot1.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| arduino-05-if-statement | pot1.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| avr02-dimmer | pot1.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| avr06-blink-and-print | pot1.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| nano03-two-tasks | pot1.wiper | 2.5 | 2.5000 | 2.5000 | -0.0000 |
| pico03-two-tasks | pot1.wiper | 1.65 | 1.6500 | 1.6500 | -0.0000 |

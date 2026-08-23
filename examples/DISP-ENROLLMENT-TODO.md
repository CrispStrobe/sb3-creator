# disp-* enrollment — benches generated, seating not yet clean

The seven `disp-*` display examples were enrolled in `4f2cefe` with hand-authored
`circuit.json` files. That enrollment was incomplete, and `npm test` (not
`gallery.test.mjs` alone) is what shows it. This branch carries the work so far.

## What the corpus requires that we did not do

Two contracts disagree until an example carries per-device benches:

- `retarget-gallery`: `index.json` `devices` must equal what
  `retargetPseudocode` offers, minus anything ledgered in `transformRefused`.
- `example-corpus-contract`: `devices` must equal authored circuit + **generated
  benches** — the `circuit.<device>.json` files.

With `devices: ["stc12c5a60s2"]` the first fails; widening it without benches
makes the second fail. Both pass only once `gen-device-benches.mjs batch/seat/
index` has produced and seated real benches, the way 01-blink and the rest carry
theirs.

## Done here

- `gen-device-benches.mjs batch --only <id>` for all seven; `seat` reports 51
  seated, 44 legitimately unseated, 0 failed; `index` gives 113 entries a
  benches map.
- `retarget-amplification`'s `EXPECTED_UNSUPPORTED` gains
  `devices_setpixel`, `devices_clearmatrix`, `devices_setneopixel`,
  `devices_showdigit`, `devices_setrgb` — the MATRIX8X8 / NEOPIXEL / SEVENSEG8
  verbs, for the same stated reason as the LCD/OLED entries already there: the
  referee traces PINS, not displays.
- `disp-bargraph` joins `CROSS_DEVICE_ADC_PIN_EXCEPTIONS`, next to its sibling
  `16-ldr-bargraph`. `set level to read pot / 128` is a RAW threshold, so the
  same pot position lights a different number of LEDs on a 10-bit ADC than a
  12-bit one. Per-device correct; asserting identity would be wrong.

That took the suite from 10 failures to 2.

## What remains — the reason this is not on main

The generated benches seat badly: `mcu1 overlaps bb1` in
`disp-sevenseg/circuit.{arduino-mega,arduino-uno,atmega168p}.json` and
`disp-rgb-light/circuit.{arduino-mega,arduino-uno}.json`, failing "all
controller benches have finite, non-overlapping, powered boards" and "all
generated seated component bodies are disjoint in rendered geometry".

That is seating-quality work on generated artifacts, not a config fix. Finish it
here and enrol the seven in one green commit rather than leaving main red.

Baseline: sb3-creator main with the seven REMOVED is 0 failures.

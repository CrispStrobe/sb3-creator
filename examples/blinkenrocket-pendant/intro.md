---
level: advanced
age: 14+
prereqs: [arduino-01-blink, arduino-05-for-loop]
teaches: [multiplexing, led-matrix, polarity, column-scanning, attiny88]
---
## What you see
A pendant badge with an ATtiny88 driving a bare 8x8 LED matrix (788AS) through column scanning. It beats a heart: a big frame and a small frame alternate about three times a second. Two buttons slow the beat while held. The matrix is multiplexed: only one column is on at any instant, but scanning all 8 fast enough makes the whole image appear solid.

## Try this
1. Run the program — a heart beats on the matrix, big frame then small frame.
2. Hold either button and watch the beat slow down: each frame gains a 0.2 s pause.
3. In the circuit, set the matrix's `colActiveHigh` to `true` and `rowActiveHigh` to `false` — the 788BS common-cathode wiring — and observe: every LED glows dimly instead of showing a pattern, because the column and row polarity are both wrong. Those two params are what the engine reads; the part number is a label, not a simulated field.

## What is going on
Column scanning drives one column LOW (active) at a time and sets the 8 row pins to the pattern for that column. Cycling through all 8 columns faster than the eye can track (typically >100 Hz) creates a steady image. The 788AS matrix has columns active LOW and rows active HIGH; the 788BS has the opposite. Wrong polarity means weak current through unintended paths — a dim, uniform glow instead of a crisp pattern.

## Go further
- [arduino-07-row-column-scanning](../arduino-07-row-column-scanning) — the same multiplexing on a standard Arduino.
- [arduino-05-arrays](../arduino-05-arrays) — sequential LED patterns on individual pins.

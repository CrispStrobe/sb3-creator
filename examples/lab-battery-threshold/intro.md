---
level: beginner
age: 12+
prereqs: [pc02-voltage-divider, pc05-npn-switch]
teaches: [voltage-divider, threshold, base-emitter-voltage]
---
## What you see
Three LEDs, each behind a transistor and a voltage divider. Depending on the battery voltage, none, one, two or all three light: flat, weak, OK, full.

## Try this
1. Click **Sim**. At 6 V, red and yellow are on.
2. Lower the battery voltage step by step. Which LED goes out first?
3. Raise it to 9 V: all three.
4. Find the exact voltage where green just starts to glow.

## What is going on
A transistor only conducts once its base is about 0.7 V above the emitter. The divider hands the base a fixed fraction of the battery voltage. A smaller lower resistor means a smaller fraction, so that stage needs a higher battery voltage before it switches on. Three dividers give three thresholds — a simple bar graph without a microcontroller.

## Go further
- [pc02-voltage-divider](../pc02-voltage-divider) — the divider on its own.
- [lab-window-comparator](../lab-window-comparator) — sharp thresholds with comparators.

---
level: intermediate
age: 12+
prereqs: [pc77-klemmenspannung]
teaches: [loaded-source, voltage-sag, internal-resistance, battery]
---
## What you see
A battery (9 V, 2 Ω internal resistance) powers two parallel load paths: a light one (1 kΩ) and a heavy one (100 Ω). Both have an LED as an indicator. The heavy load path draws more current and causes a larger voltage drop.

## Try this
1. Light path alone: I = 9 / (2 + 1000) ≈ 9 mA. V_terminal ≈ 8.98 V. LED shines brightly.
2. Heavy path alone: I = 9 / (2 + 100) ≈ 88 mA. V_terminal ≈ 8.82 V. LED slightly dimmer.
3. Both paths: total current rises, terminal voltage drops further.

## What is going on
The battery's internal resistance acts like a series resistor for all loads combined. The more total current flows, the more voltage is "lost" inside the battery, and the less voltage is available to the LEDs.

## Go further
- [pc77-klemmenspannung](../pc77-klemmenspannung) — open-circuit vs terminal voltage.
- [pc80-quellen-vergleich](../pc80-quellen-vergleich) — two batteries with different internal resistances.

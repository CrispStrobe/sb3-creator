---
level: advanced
age: 14+
prereqs: [51-555-astable, pc48-ldr-comparator]
teaches: [555-timer, LDR, light-controlled-frequency]
---
## What you see
An LDR controls the blink rate of a 555 astable: in bright light the LED blinks fast (LDR low resistance → short time constant), in darkness it blinks slowly (LDR high resistance → long time constant).

## Try this
1. Click **Sim** — the LED blinks.
2. Change the LDR value: bright → fast blink, dark → slow blink.
3. The blink rate changes smoothly with light level.

## What is going on
The LDR replaces R₂ in the 555 astable. The frequency f = 1.44 / ((R₁ + 2·R_LDR) × C) depends directly on the LDR resistance. Since the LDR range is typically 1 kΩ (bright) to 100 kΩ (dark), the frequency changes by a factor of ~100.

## Go further
- [51-555-astable](../51-555-astable) — 555 astable with fixed frequency.
- [pc72-tagschaltung](../pc72-tagschaltung) — LDR driving a transistor instead of a timer.

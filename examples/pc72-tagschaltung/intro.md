---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch, pc48-ldr-comparator]
teaches: [LDR, transistor-switch, voltage-divider, light-sensor]
---
## What you see
A daytime switch: the LED lights only when it is bright. A light-dependent resistor (LDR) drives an NPN transistor — in bright light the LDR resistance drops, more base current flows, and the transistor switches on.

## Try this
1. Click **Sim** — with a bright LDR value the LED is on.
2. Change the LDR value to dark — the LED turns off.
3. Compare with the [night switch](../pc73-nachtschaltung), where the LED lights in the dark.

## What is going on
The LDR and a fixed resistor form a voltage divider. In bright light the LDR is low resistance, the voltage at the divider point rises above the transistor's base-emitter threshold (~0.7 V), and the transistor switches the LED on.

## Go further
- [pc73-nachtschaltung](../pc73-nachtschaltung) — the complementary circuit (LED on in darkness).
- [pc48-ldr-comparator](../pc48-ldr-comparator) — LDR with a comparator instead of a transistor.

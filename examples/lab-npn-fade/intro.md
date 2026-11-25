---
level: beginner
age: 10+
prereqs: [lab-crossfade]
teaches: [rc-charging, emitter-follower, transistor]
---
## What you see
An electrolytic capacitor with an **UP** and a **DOWN** button, two transistors, a red and a green LED, and a **FAST** slide switch that picks a smaller capacitor.

## Try this
1. Click **Sim**: green is lit, red is dark.
2. Hold **UP** for a few seconds: green slowly fades out while red slowly fades in.
3. Let go: the colours stay roughly where they are (they drift back only slowly).
4. Hold **DOWN**: red fades out, green comes back.
5. Move **FAST** to the small capacitor and repeat: the same crossfade, about four times quicker.

## What is going on
**UP** charges the capacitor through 10 kΩ, **DOWN** empties it through another 10 kΩ, so its voltage rises and falls slowly. The left transistor copies that voltage (less about 0.7 V) onto the red LED and its resistor: as the voltage climbs, red gets brighter. The right transistor is fed from the same capacitor and sits across the green LED: the more it conducts, the more of green's current it takes away, so green fades out exactly while red fades in. A smaller capacitor fills and empties faster. The two transistors draw a little current from the capacitor, which is why a held level slowly sinks.

## Go further
- [lab-crossfade](../lab-crossfade) — a crossfade with an op-amp.

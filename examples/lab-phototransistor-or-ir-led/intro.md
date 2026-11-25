---
level: beginner
age: 10+
prereqs: [lab-light-link]
teaches: [phototransistor, photodiode, testing-components]
---
## What you see
Two clear parts that look almost the same: one is a phototransistor, the other an infrared LED. Each is in series with a red indicator LED across the battery, and a white lamp shines on both.

## Try this
1. Click **Sim**. One indicator glows, the other stays dark.
2. Move the first light path's distance knob to 10 cm: that indicator nearly goes out.
3. Switch the lamp off: both are dark.

## What is going on
A phototransistor is a transistor whose base is driven by light. When light falls on it, it lets the battery's current through, enough to light an LED. An infrared LED can also turn light into current, but only the tiny amount the light itself frees, a few millionths of an ampere: nowhere near enough for an LED. So the part whose indicator glows when lit is the phototransistor.

## Go further
- [lab-led-sensor-colours](../lab-led-sensor-colours) — amplify the LED's photocurrent and see which colours it senses.
- [lab-ir-beam-alarm](../lab-ir-beam-alarm) — a phototransistor guarding an infrared beam.

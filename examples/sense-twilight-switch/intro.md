---
level: intermediate
age: 12+
prereqs: [03-night-light, 04-thermostat]
teaches: [hysteresis, time-qualification, state-machine]
---
## What you see
A lamp that turns itself on at dusk and off at dawn — and does not flicker on and off while the light is right at the edge. It also ignores short changes: a shadow, a cloud or a car's headlights do not switch it.

## Try this
1. Run the program in bright light, then lower the LDR's light level a lot. The lamp turns on a moment later — 0.8 seconds — and the serial monitor says so.
2. Move the light level to the middle. The lamp stays as it is — that middle band is the hysteresis.
3. Raise the light level and lower it again as quickly as you can. Nothing happens: the change was too short.

## What is going on
A simple night light with one threshold flickers at dusk, because the reading wobbles around that one value. This program uses two thresholds: it switches on below 300 but only switches off again above 500. Between them, it keeps whatever it was doing.

It also asks for patience. A counter goes up for every reading past the limit and back to zero as soon as one is not. Only after 8 readings in a row — 0.8 seconds — does the lamp switch. On a real porch light you would make that much longer, a minute or more. A variable `state` remembers whether the lamp is on, which decides which limit matters; that pairing of a state and its rules is a small state machine.

## Why it matters
Hysteresis and "must hold for a while" are in every thermostat, battery charger and automatic light. Without them real controls wear out relays, annoy people with flicker, or react to every passing glitch.

## Go further
- [04-thermostat](../04-thermostat) — hysteresis with a temperature sensor.
- [sense-pir-alarm](../sense-pir-alarm) — combine with motion so the lamp only reacts to people after dark.
- Experiment: use different confirmation times for on and off — quick to switch on, slow to switch off.

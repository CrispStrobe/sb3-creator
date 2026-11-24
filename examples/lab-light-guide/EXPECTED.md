# lab-light-guide — expected behaviour

## Circuit
- 9 V battery. A red LED with 470 Ω lights one end of a 1 m plastic light guide (core about 1 mm) with one bend of 3 cm radius and cleanly cut ends.
- The far end sits 1 mm in front of a phototransistor wired as an emitter follower: collector to +9 V, emitter into 470 Ω to ground. The voltmeter across the 470 Ω reads the light that arrives.
- The light guide is a `light_path` part (medium fibre). Its knob sets the bend radius from 0.4 cm to 5 cm.

## Observable behaviour
- As authored (3 cm bend) the meter reads about 2.11 V.
- Knob down to a 4 mm bend: about 1.13 V. A tight bend lets light escape through the wall; gentler than about 3 cm costs almost nothing.
- Rough cut ends (cutQuality 0): about 0.26 V. A ragged face scatters the light instead of passing it.
- A green LED in place of the red one: barely more than a quarter of the red reading (a weaker emitter, and the phototransistor is less sensitive to green).
- An infrared LED: over 0.5 m of guide it gives more than red, but over 3 m most of it is gone. Plastic fibre absorbs infrared far more strongly than red light.
- Room light on the phototransistor (its light slider at 0.3) raises the reading above 2.6 V; with the light path's `shield` at 0.95 (a sleeve over the receiver) it is back near 2.15 V.

## What this verifies
1. Light stays inside a fibre by total internal reflection, until a bend is too tight.
2. Every cut end, every metre and every colour has its own loss.
3. A shielded receiver sees the signal, not the room.

These numbers were measured on the headless engine; `test/lab-circuits-optics.test.mjs` holds them.

```assert
# Authored light guide: the phototransistor's emitter follower reads the light.
net voltmeter_7.a V 2.11 +-0.05
```

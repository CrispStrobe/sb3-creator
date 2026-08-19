---
level: beginner
age: 8+
prereqs: []
teaches: [variables, controller-panel, matrix-widget, gauge-widget, lego-hub]
---

## Spike Prime Hub — Virtual Face

A virtual faceplate for the Spike Prime hub (also Robot Inventor — same
hardware). The controller panel shows what the hub's sensors and motors
are doing — no physical hub needed.

- **5x5 light matrix** — the Spike Prime's LED grid, showing a rotating line
- **Motor gauge** — angle readout sweeping -180° to +180°
- **Distance gauge** — simulated ultrasonic sensor, 10–190 cm
- **Colour gauge** — cycling through Lego colour IDs (0–10)

## Try this

1. Click the green flag — all four faces start animating.
2. Watch the matrix: the line rotates through four positions.
3. Watch the motor gauge: it sweeps smoothly back and forth.
4. The distance and colour gauges follow the same cycle.

## What is going on

The program writes four variables each tick: `hub_matrix` (a 25-bit
bitmask), `motor_angle`, `dist_cm`, and `colour_id`. The matrix and
gauge widgets read those variables and render them live.

On real hardware the output side would route through the Lego runtime
drivers (remote or on-device via brickwright-bridges) rather than a
circuit board. The widget faces are the same either way — they show
whatever the variables hold, regardless of how those variables are set.

## Other Lego hubs

This faceplate is built for the Spike Prime, but the same pattern
extends to every Lego hub — they differ in matrix size and sensor set,
not in the model:

| Hub | Matrix | Typical sensors |
|-----|--------|-----------------|
| **Spike Prime / Robot Inventor** | 5x5 | distance, colour, force, gyro |
| **EV3** | none (LCD status) | ultrasonic, colour, gyro, touch |
| **Boost / Powered Up** | none (status LED) | colour+distance combo, tilt |
| **WeDo 2.0** | none (status LED) | tilt, distance |
| **NXT** | none (LCD status) | ultrasonic, light, sound, touch |

To make a faceplate for another hub, clone this example and adjust the
matrix size (or remove it for hubs without a grid) and swap the gauge
set to match that hub's sensors. The variable-binding pattern is identical.

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

Each Lego hub is a genuinely different device, not a variant of this one:
they differ in display hardware, so each needs its own faceplate rather
than a reskin of the Spike Prime's. All five now ship:

| Hub | Display | Extension | Faceplate |
|-----|---------|-----------|-----------|
| **Spike Prime / Robot Inventor** | 5x5 LED matrix | `spikeprime` | this example (`matrix` + 3 `gauge`) |
| **EV3** | 178x128 mono LCD | `ev3comprehensive` | `ev3-faceplate` (`mono_lcd` + 3 `button`) |
| **NXT** | 100x64 mono LCD | `legonxt` | `nxt-faceplate` (`mono_lcd` + 3 `button`) |
| **WeDo 2.0** | RGB status light | `wedo2unified` | `wedo2-faceplate` (`rgb_light` + 2 `slider`) |
| **Boost / Powered Up** | RGB status light | `legoboostunified` | `boost-faceplate` (`rgb_light` + `slider`) |

What is shared is the *framework* — variable binding, the widget pump, and
the `controller.json` format — not the widget set. Each hub gets its own
example on that framework with the widgets its display actually has.

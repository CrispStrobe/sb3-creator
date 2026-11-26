# lab-npn-heat-alarm — expected behaviour

## Circuit
9 V. The sensor is an NPN on its leads (`npn_3`, the exponential Ebers–Moll transistor model) in surroundings of its own: `surroundC` (the Temperature slider) with a thermal time constant of 1.5 s. Its base is held by 100 kΩ (`resistor_5`) from +9 V against 6.2 kΩ (`resistor_6`) plus a 1 kΩ trimmer used as a variable resistor (`potentiometer_7`, at position 0.25, so three quarters of it in circuit) to ground. Its collector is the base node of `npn_4`, fed from +9 V through 47 kΩ (`resistor_8`). `npn_4` runs the green LED (`led_10`) through 470 Ω (`resistor_9`).

## Observable behaviour
- About 0.18 mA comes through the 47 kΩ. Whatever the sensor transistor does not take goes into the LED transistor's base, and the LED current is about 100 times that, up to about 14 mA when the LED transistor saturates.
- The sensor's base sits at about 0.58 V. A silicon junction needs about 2 mV less per degree for the same current, so its collector current rises roughly tenfold per 30 °C.

| surroundings | LED current |
|---|---|
| ice, 0 °C | about 14.2 mA (full) |
| room, 25 °C | about 12.0 mA |
| fingers, 33 °C | about 8.0 mA (dimmer) |
| hot air, 70 °C | 0 (dark: alarm) |

- Each change takes a few seconds to settle (the transistor's own warming up, 1.5 s time constant).
- Turning the trimmer to 0.75 lowers the sensor's base voltage: at 40 °C the LED still carries about 13.5 mA.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs`, 8 s at each temperature. The rows are one run, each stepped from the one before:

| surroundings | LED current |
|---|---|
| 25 °C | 11.95 mA (sensor base 0.581 V) |
| 33 °C | 7.98 mA |
| 70 °C | 0.000 mA |
| 0 °C | 14.24 mA |
| back at 25 °C | 11.8 mA |

## What this verifies
1. A transistor's base–emitter voltage falls by about two millivolts per kelvin: the junction itself is a thermometer.
2. With the base voltage held, that small shift is a large change of collector current, which a second transistor turns into light.

## Simulation notes
The default transistor model is a piecewise knee and switches abruptly; the sensing transistor is therefore the exponential model (`model: 'shockley'`), whose saturation current carries the temperature. The LED transistor keeps the default model.

```assert
# t = 1 ms at room temperature: sensor biased at the edge, LED transistor active
net npn_3.base V 0.581 +-0.01
net npn_4.base V 0.686 +-0.02
net npn_4.collector V 1.31 +-0.1
net led_10.anode V 3.41 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 37** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-heat-alarm` prints them one by one.
<!-- engine-provenance -->

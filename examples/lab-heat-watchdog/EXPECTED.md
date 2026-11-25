# lab-heat-watchdog — expected behaviour

## Circuit
- 5 V supply. Two NPN transistors as a current mirror: the reference, base tied to collector, takes about 94 µA through 47 kΩ; the sensor shares its base voltage and copies that current into 22 kΩ.
- Both transistors sit in surroundings of their own (each has a Temperature slider, 25 °C as authored, time constant 1 s). They are solved on the exponential junction law: at a held base voltage a transistor 1 K warmer carries about 8 % more current.
- The sensor's collector drives gate 1 of a 74HC132 (inputs joined: an inverter). Its output lights a red LED (470 Ω) and enables gate 2 (22 kΩ / 100 nF), the alarm tone, into a piezo through 1 kΩ. Gates 3 and 4 are unused.

## Observable behaviour
- Both at 25 °C: the sensor's collector sits at about 3.0 V, above the gate's upper threshold (2.75 V). Silence.
- Sensor 3 K warmer: about 2.46 V, still no alarm (the gate holds its state between its thresholds).
- Sensor at 30 °C: about 2.04 V; at 33 °C: about 1.28 V, below the lower threshold (1.78 V): the red LED lights and the piezo sounds at about 570 Hz.
- Both at 33 °C, both at 70 °C, or both at 0 °C: the collector stays near 3 V and nothing happens. The mirror compares the two; a change that reaches both cancels.
- Moving the sensor's slider from 25 to 33 °C: the alarm comes on after about 1.5 s, when the sensor has reached about 31 °C.

## Measured on the engine
Sensor collector at 20 ms: 2.977 V (both 25 °C), 2.455 V (sensor 28 °C), 2.036 V (30 °C, alarm), 1.275 V (33 °C, alarm, tone 567 Hz); both at 33 / 70 / 0 °C: 2.970 / 2.936 / 3.000 V, no alarm. Live: alarm at 31.2 °C, 1.46 s after the slider moved; back off at 26.4 °C when it is returned to 25 °C. `test/lab-circuits-r6d.test.mjs` holds these.

## Why
In a current mirror the reference transistor sets a base voltage that makes its own current flow. A sensor transistor that is warmer needs less base voltage for that current, so at the same base voltage it carries more: about 8 % per kelvin, which across 22 kΩ is about 0.17 V per kelvin near room temperature. Warming both moves the shared base voltage instead and leaves the copy unchanged.

## What this verifies
1. A transistor junction is a thermometer: at a held current its voltage falls about two millivolts per kelvin.
2. A matched pair cancels a temperature change that reaches both.
3. A Schmitt gate turns a slowly falling voltage into a clean alarm.

```assert
# t = 1 ms: both at 25 °C, mirror balanced, no alarm
net vsource_2.pos V 5.00 +-0.01
net npn_4.base V 0.593 +-0.01
net npn_5.collector V 2.98 +-0.05
net 74hc132_7.1y V 0.00 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2c62bd5` and `bw-circuit-ui@15b936d` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 47** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-heat-watchdog` prints them one by one.
<!-- engine-provenance -->

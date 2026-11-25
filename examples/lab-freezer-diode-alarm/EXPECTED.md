# lab-freezer-diode-alarm — expected behaviour

## Circuit
- 9 V supply. The current mirror again (exponential-junction NPN, Q1 diode-connected with 47 kΩ from +9 V), now with a diode under each emitter: the reference diode under Q1 on the bench, the sensor diode under Q2 in the freezer (its own surroundings, −10 °C as built, 1 s thermal time constant).
- Q2's collector load: 68 kΩ plus a 22 kΩ trimmer (at half); through 100 kΩ it drives the kill NPN of the LM386 alarm oscillator (as in the heat alarm).

## Observable behaviour
- Freezer at −10 °C: the cold sensor diode drops more, Q2 carries less than Q1, its collector sits at 2.6 V: silence. Ice (0 °C): 1.7 V; 5 °C: 1.1 V — still silent.
- Thawing (10 °C and above): Q2's collector falls below what the kill NPN needs and the alarm sounds. Taking the sensor from the freezer into the room, the alarm starts at about 8 °C.
- Compared with the frost warner the sensor is turned round to the other side of the mirror, so WARMING sets it off.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: Q2 collector 2.57 V (sensor −10 °C), 1.68 V (0 °C), 1.13 V (5 °C), all silent; 0.59 V at 10 °C and 0.51 V at 25 °C, both with the 615.9 Hz alarm. Sensor moved from −10 °C into the room: alarm after 740 ms, at 8.3 °C.

## What this verifies
1. A diode's forward drop is a thermometer too.
2. Moving the sensor to the other leg of the mirror reverses the direction that trips the alarm.

## Simulation notes
The two diodes are plain diodes, whose drop follows their own temperature in the engine.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_5.collector V 2.57 +-0.03
net npn_4.base V 1.08 +-0.005
net lm386_12.inp V 0.054 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 30** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-freezer-diode-alarm` prints them one by one.
<!-- engine-provenance -->

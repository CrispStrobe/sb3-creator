# lab-hall-tacho — expected behaviour

## Circuit
- 9 V supply. A small motor (`dc_motor_encoder_3`, flyback diode) carries a disc with eight magnets that pass a Hall switch: the motor's pulse output, eight pulses per turn.
- Tachometer: the pulses switch an NPN (`npn_6`, 10 kΩ base, 4.7 kΩ pull-up); its collector drives a diode pump (10 nF and two diodes) into 1 µF with 47 kΩ across it. Every pulse delivers the same small charge, so the voltage there is proportional to the pulse rate. A meter (`analog_meter_13`, 1 V full scale, two hundred kilohms) reads it.
- Regulator: one half of an LM358 (`lm358_16`) compares that voltage (− input) with a set potentiometer (`potentiometer_15`, 47 kΩ + 10 kΩ from +9 V; + input). Its output switches the motor driver, an LM386 (`lm386_21`) fed through 620 kΩ, with 2.4 MΩ biasing its − input.
- A slide switch (`slide_switch_17`) replaces the comparator by a plain throttle potentiometer (`potentiometer_18`).

## Observable behaviour
- Regulated, no load: the motor settles at about 180 rad/s and stays there; the tachometer voltage sits at the set voltage.
- Regulated with a load on the shaft: the loop switches the driver on for longer; the speed hunts up and down around the set value (on/off control), but its average stays near it.
- The meter reading is proportional to the pulse rate, i.e. to the speed.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`.

| mode | speed |
|---|---|
| regulated, no load, 0.5–1 s | 179 rad/s, steady |
| regulated, load 0.004 N·m, average over 0.4–1.2 s | about 173 rad/s (swinging between about 80 and 250) |

## What this verifies
1. Pulses of a fixed charge, averaged, give a voltage proportional to their rate: a frequency-to-voltage converter, i.e. a tachometer without contacts.
2. Feeding that voltage back against a set value regulates the speed (closed loop). An on/off regulator hunts around the set value; a proportional one would settle more smoothly.

```assert
# t = 1 ms: setpoint and LM386 bias
net potentiometer_15.wiper V 0.68 +-0.03
net lm386_21.inn V 0.18 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 14** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-hall-tacho` prints them one by one.
<!-- engine-provenance -->

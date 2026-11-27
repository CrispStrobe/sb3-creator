# lab-ptc-bridge — expected behaviour

## Circuit
- 9 V supply. Bridge, left arm: 39 kΩ from +9 V to node A, the silicon PTC sensor (`ptc_sensor_4`, r25 = 2000, i.e. two kilohms at 25 °C) from A to ground. Right arm: 39 kΩ to node B, then 1.8 kΩ and a 470 Ω balance potentiometer (`potentiometer_7`, used as a variable resistor) to ground.
- A centre-zero meter (`analog_meter_8`, 50 mV full scale, ten kilohms) between A and B.
- An LM386 (`lm386_9`) with pins 1 and 8 joined (gain 200) compares A (+ input) with B (− input): warmer → output high → red LED (1 kΩ to ground) on; colder → output low → green LED (1 kΩ from +9 V) on.
- The sensor sits in its own surroundings (Temperature slider, 25 °C as built, thermal time constant 1 s).

## Observable behaviour
- 25 °C: the bridge is balanced, the meter at 0.
- 15 °C: the meter reads at about −22 mV, the comparator output is low, green LED on.
- 35 °C: at about +23 mV, output high, red LED on.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, after 0.3 s at each temperature, values at about the stated settings (a sequence or a waveform swing, which no single solve stands in for).

| temperature | sensor | meter | comparator | LEDs |
|---|---|---|---|---|
| 15 °C | — | −22.1 mV | 0.90 V | green |
| 25 °C | 2000 Ω | +0.04 mV | (balanced) | — |
| 35 °C | 2162 Ω | +22.6 mV | 8.10 V | red |

## What this verifies
1. A silicon PTC sensor's resistance rises about 0.8 % per kelvin (2000 Ω → 2162 Ω for +10 K).
2. A bridge shows only the difference between its two arms, so a small change of one resistor gives a reading around zero that a sensitive meter can show.
3. With the bridge voltage kept low (0.42 V) the LM386's ground-referenced inputs work as a comparator with a gain of 200.

## Simulation notes
The sensor follows R = R25 (1 + 7.88e-3 ΔT + 1.937e-5 ΔT²) at its own temperature; with 0.2 mA through it, it warms itself by much less than 0.1 K. Near the balance point the LM386 is linear, so both LEDs glow faintly within about 2 K of 25 °C.

```assert
# t = 1 ms, 25 C: the bridge is balanced
net ptc_sensor_4.a V 0.423 +-0.005
net resistor_6.a V 0.423 +-0.005
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 35** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ptc-bridge` prints them one by one.
<!-- engine-provenance -->

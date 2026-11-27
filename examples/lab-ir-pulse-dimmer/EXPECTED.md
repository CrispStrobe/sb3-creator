# lab-ir-pulse-dimmer — expected behaviour

## Circuit
- 9 V supply. Transmitter: the LM386 oscillator with a 470 nF timing capacitor that charges through one diode, 1 kΩ and one side of the 10 kΩ DUTY pot, and discharges through the other diode, 1 kΩ and the other side: the wiper sets how long the output stays high. While it is high the IR LED flashes (220 Ω).
- Receiver 3 cm away: a phototransistor emitter follower (10 kΩ). Each flash charges 10 µF through a diode and 1 kΩ; 10 kΩ drains it between flashes; an NPN emitter follower turns that held voltage into the green LED's current (470 Ω).

## Observable behaviour
- DUTY at 0.2: short flashes (about 22 % of the time); the transmitter's LED averages about 7 mA, the held voltage stays low and the receiver LED is dark.
- DUTY at 0.8: long flashes (about 70 %); the transmitter averages about 21 mA, the held voltage rises and the receiver LED gets about 7 mA.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs` (30 ms after 60 ms of settling): pot 0.2: high 22.3 % of the time, IR LED 6.9 mA average, held voltage 2.50 V, receiver LED practically dark (hundredths of a milliamp); pot 0.8: high 70.0 % of the time, IR LED 21.3 mA average, held voltage 6.68 V, receiver LED about seven milliamps.

## What this verifies
1. Short light pulses carry a signal with a fraction of the power.
2. An integrating (diode + capacitor) receiver turns the duty cycle into a level: a wireless dimmer.

## Simulation notes
Measured headless on the committed circuit; `test/lab-circuits-r6c.test.mjs` replays the learner's controls.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm386_3.vout V 8.09 +-0.02
net lm386_3.inp V 5.11 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ir-pulse-dimmer` prints them one by one.
<!-- engine-provenance -->

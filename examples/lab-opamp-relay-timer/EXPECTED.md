# lab-opamp-relay-timer — expected behaviour

## Circuit
- 9 V supply. 100 kΩ and a 4.7 MΩ TIME rheostat (potentiometer_4, at 0.3 as built) charge the timing capacitor: 470 µF with the RANGE slide switch (slide_switch_5) left, 4.7 µF right. START (button_8) empties it through 100 Ω.
- An LM324 section: − input on the capacitor; + input on 6.07 V (100 kΩ / 200 kΩ, with 1 MΩ from the output: 6.07 V while high, 5.63 V once switched).
- Its output lights a yellow LED and drives an NPN (4.7 kΩ) holding a relay (200 Ω coil, flyback diode) whose contact lights a lamp.

## Observable behaviour
- Switch-on starts the time: relay in, lamp lit.
- 4.7 µF: the lamp goes out after 17.9 s; START restarts it.
- 470 µF: a hundred times longer, 30 minutes.
- Knob: from about 0.5 s (53 s) up to about 25 s (42 min).

## Measured on the engine
bw-board d4113b4b, `test/lab-circuits-r6h.test.mjs`: thresholds 6.073 V / 5.625 V; 4.7 µF at 0.3: relay out at 17.91 s; after START the capacitor is empty and the relay is in again; capacitor after 0.2 s on 4.7 µF 0.112 V, after 20 s on 470 µF 0.112 V.

## What this verifies
1. Charging to 6.07 V of 9 V takes R·C·ln(9/2.93) = 1.12·R·C: 3.39 MΩ × 4.7 µF → 17.9 s.
2. The time is linear in C: the 470 µF range follows exactly the same curve 100 times slower, so the 30-minute run (1791 s) is the 17.9 s run scaled.
3. Hysteresis keeps the relay from chattering as the capacitor creeps past the threshold.

## Simulation notes
The engine steps devices at least every millisecond, so a full 30-minute run would cost tens of minutes of solver time; the scenario test times the 4.7 µF range and checks the 470 µF range on the first 20 s of its curve. Electrolytic leakage and the op-amp's input bias current are not modelled; on a real bench they lengthen the long range a little.

```assert
# 1 ms after switch-on (the solve assert-physics runs): timing, relay in
net lm324_10.1_pos V 6.073 +-0.02
net lm324_10.1_out V 7.165 +-0.05
net npn_17.collector V 0.10 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **20 of this page's 42** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-relay-timer` prints them one by one.
<!-- engine-provenance -->

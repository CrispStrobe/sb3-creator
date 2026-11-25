# lab-hum-finder — expected behaviour

## Circuit
- 9 V supply, 100 µF across it. An LM386 audio amplifier: −IN to ground, the output through 220 µF into an 8 Ω loudspeaker, 10 µF on the BYPASS pin.
- Its +IN carries nothing but a field probe: a short bare wire coupled to a hidden 230 V / 50 Hz mains cable. The probe's knob is the distance; at 1 the coupling is 5 pF, and it falls in proportion to the knob. The bench starts at 0.5.
- Pins 1 and 8: a 10 µF electrolytic through a slide switch, either straight to pin 8 (left, authored) or through a 1.2 kΩ resistor (right).

## Observable behaviour
- Knob at 0.5, switch left: the loudspeaker hums at 50 Hz, about 0.83 V of 50 Hz at the output.
- Switch right: the same hum at about half the amplitude, 0.41 V.
- Knob at 0: silence (less than 2 % of the hum).
- More knob, louder hum: the coupling is proportional to it.

## Measured on the engine
| knob | switch | 50 Hz at the output |
|---|---|---|
| 0.5 | left (gain 200) | 0.83 V |
| 0.5 | right (1.2 kΩ in the gain path) | 0.41 V |
| 0 | left | below 0.02 V |

`test/lab-circuits-fields.test.mjs` holds these.

## Why
A few picofarads at 50 Hz are hundreds of megohms, but the cable's 325 V peak still drives a fraction of a microamp through them into the amplifier's 50 kΩ input: millivolts. The LM386 multiplies by about 200 with the capacitor across pins 1 and 8; a resistor in series with it lets less of the internal feedback be bypassed and the gain, and the hum, fall.

## What this verifies
1. Capacitive coupling from a mains cable into a high-impedance input.
2. The hum scales with the coupling (distance).
3. The gain network sets how much of it is heard.

```assert
# the supply rail; the hum itself is checked in the scenario test
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d4113b4` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-hum-finder` prints them one by one.
<!-- engine-provenance -->

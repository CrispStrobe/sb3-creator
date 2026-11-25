# lab-amp-ic-coin-toss — expected behaviour

## Circuit
- 9 V battery, one LM386 (pins 1, 7, 8 open) as a Schmitt trigger: output → 47 kΩ → +IN, battery → 47 kΩ → +IN, so +IN sits higher while the output is high than while it is low: two switching levels.
- −IN is held between those two switching levels by 22 kΩ from the battery and 33 kΩ to ground.
- Timing: output → 4.7 kΩ → a 1 µF capacitor to ground. A button connects that capacitor to −IN.
- Red LED: output → 1 kΩ → red LED → ground (lit while the output is high).
- Green LED through a transistor inverter: battery → 1 kΩ → green LED → ground, with an NPN from the LED's anode to ground; the NPN's base is driven from the output through a 10 kΩ / 10 kΩ divider. While the output is high the NPN shorts the green LED.

## Observable behaviour
- At rest the output is low: green.
- Holding the button turns the circuit into an oscillator (the capacitor now swings −IN across both switching levels): red and green flicker about 170 times a second, too fast to follow.
- Releasing the button freezes whichever state it is in at that instant: −IN returns to its fixed level between the two switching levels, so either state holds. Which one is pure chance for a human press: heads or tails.

## Measured on the engine
- Rest, at t = 1 ms: output 0.900 V, +IN 3.367 V, −IN 4.272 V; green LED current about 7 mA, red dark.
- Button held from 5 ms: the press itself flips the output high at 5.5 ms (the capacitor, still at 0.6 V, pulls −IN down); then edges at 11, 13.5, 17, 19.5, 23, 25.5 ... ms (3.5 ms high, 2.5 ms low).
- Released at 43 ms (output low): stays low (green) for the next 50 ms.
- Released at 45 ms (output high): stays high (red, 6.4 mA), green shorted by the transistor.

## What this verifies
1. Hysteresis: with −IN between the two switching levels the circuit is a memory (bistable).
2. The same circuit with an RC on −IN is an oscillator.
3. A transistor inverter gives the complementary output.

## Simulation notes
In the engine the result depends only on the release time, which is what makes it a fair coin for a person. `test/lab-circuits-r6b.test.mjs` releases at the two times above and checks that each result holds.

```assert
# t = 1 ms, at rest: output low, -IN at its fixed 4.27 V, green lit.
net lm386_3.vout V 0.900 +-0.03
net button_8.b V 4.272 +-0.03
net led_17.anode V 2.021 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2c62bd5` and `bw-circuit-ui@15b936d` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-coin-toss` prints them one by one.
<!-- engine-provenance -->

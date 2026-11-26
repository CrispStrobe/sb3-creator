# lab-amp-ic-clap-latch — expected behaviour

## Circuit
- 9 V battery.
- Microphone: a loudspeaker (8 Ω) into +IN of an LM386 (−IN grounded, 10 µF across the gain pins 1 and 8: gain 200; 10 µF on the bypass pin 7). Its Sound slider plays a sung vowel; as authored the room is quiet.
- THRESHOLD pot (1 kΩ, wiper at 1/2) between 3.3 kΩ to +9 V and 1.8 kΩ to ground: its wiper sets the bias, 2.66 – 4.13 V.
- Input path: output → 220 nF → node K (47 kΩ from the wiper) → 1N4148 → Q1's base; 4.7 kΩ from the wiper to Q1's base. RESET button: Q1's base → 470 Ω → ground.
- Emitter-coupled Schmitt trigger: Q1 and Q2 share 2.2 kΩ from their emitters to ground. Q1's collector load: 2.2 kΩ from +9 V and the red LED (anode at the 2.2 kΩ, cathode at the collector). From the LED's anode 10 kΩ to Q2's base, 10 kΩ from there to ground. Q2's collector: 2.2 kΩ to +9 V.

## Observable behaviour
- At switch-on the trigger comes up armed: Q2 conducts, Q1 is off, the LED is dark (the 10 µF on pin 7 lets the amplifier's output rise slowly, over about 0.3 s, so the coupling capacitor follows it without kicking the trigger).
- Talking near the microphone: nothing.
- A loud clap: the LED lights and stays lit.
- RESET: the LED goes out; the next clap lights it again.
- THRESHOLD: turned up, the bias sits nearer the switching point and a quieter clap will do.

## Measured on the engine
Q1's base slowly swept by the pot (5 ms per step): the trigger flips on between base 3.83 and 3.91 V and back off between 3.04 and 2.95 V: about 0.9 V of hysteresis. Armed at pot 1/2: Q1's base 3.39 V, emitters 3.29 V, LED 0 mA. Latched: emitters 2.64 V, LED 1.19 mA.

The slider's sound for 20 ms, then 30 ms of quiet:

| pot | sound | result |
|---|---|---|
| 1/2 | 80 dB (talking) | stays dark |
| 1/2 | 120 dB (a loud clap) | latched, still lit 100 ms later; RESET clears it |
| 1/2 | 110 dB | stays dark |
| 0.8 (base 3.84 V) | 110 dB | latched (LED 1.38 mA) |

With a noise burst (a clap's spectrum) the same trigger latches at pot 1/2 at 110 dB (not at 104 dB), and at pot 0.8 at 104 dB.

## What this verifies
1. A loudspeaker-microphone and an LM386 at gain 200 turn a clap into a swing of a volt or more.
2. Two transistors sharing an emitter resistor form a Schmitt trigger: it switches on at a higher input voltage than it switches off. A bias between the two keeps whichever state it was last pushed into: a memory.
3. A diode passes only the clap's upward swings, so its downward half cannot undo the switching.
4. The bias's distance from the upper switching point is the sensitivity.

## Simulation notes
`test/lab-circuits-r6g.test.mjs` lets the amplifier settle for 300 ms, plays the slider's sounds above and reads the LED current, the emitter voltage and Q1's base.

```assert
# t = 1 ms: the amplifier's output still at its low limit while pin 7 charges; the trigger armed (Q2 on, Q1 off), LED dark.
net lm386_4.vout V 0.900 +-0.05
net npn_13.base V 3.326 +-0.05
net resistor_19.a V 3.294 +-0.05
net npn_13.collector V 7.121 +-0.15
net npn_14.collector V 5.739 +-0.15
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 38** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-clap-latch` prints them one by one.
<!-- engine-provenance -->

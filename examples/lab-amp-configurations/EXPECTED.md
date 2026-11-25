# lab-amp-configurations — expected behaviour

## Circuit
- 9 V supply; one signal generator (sine, 1 kHz, 10 mV amplitude, a small output resistance) feeds three NPN stages at once.
- **Common emitter:** 47 kΩ / 10 kΩ base divider, signal in through 1 µF, 1 kΩ emitter resistor bypassed by 22 µF, 4.7 kΩ collector resistor; output at the collector.
- **Common collector (emitter follower):** 47 kΩ / 47 kΩ base divider, signal in through 470 nF, collector on +9 V, 3.9 kΩ emitter resistor; output at the emitter.
- **Common base:** 47 kΩ / 10 kΩ base divider with the base held still by 2.2 µF, signal into the emitter through 4.7 µF and 220 Ω, 1 kΩ emitter resistor, 4.7 kΩ collector resistor; output at the collector.
- An oscilloscope: channel 1 on the generator, channel 2 on the output two slide switches pick.

## Observable behaviour
- Common emitter: a big output, upside down (the collector falls when the input rises).
- Common collector: the input again, the same size and the right way up.
- Common base: a big output the right way up, but it takes its signal current straight from the generator through the emitter.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`, 60 ms after switch-on, over 2 ms: input 16.4 mV peak-to-peak; common emitter bias 4.97 V, gain 146, inverted (correlation with the input −0.95); common collector bias 3.62 V, gain 1.03, in phase (+0.99); common base bias 5.14 V, gain 18.5, in phase (+0.99).

## What this verifies
1. The common-emitter stage amplifies voltage and inverts it.
2. The emitter follower has a voltage gain of about one, in phase; its use is its high input and low output resistance.
3. The common-base stage amplifies voltage without inverting; its input is the low-resistance emitter.

## Simulation notes
The coupling capacitors start empty, so the stages need some tens of milliseconds to reach their bias. The generator's own output resistance feels the low common-base input, so the signal at the inputs is a little smaller than 20 mV peak-to-peak. The transistors use the exponential junction model, so their gain follows gm = Ic / 26 mV.

```assert
# 1 ms after switch-on the coupling capacitors are still charging: the
# bases are on their way up to their dividers (RC with each divider)
net npn_7.base V 0.195 +-0.03
net npn_14.base V 0.405 +-0.03
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **19 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-configurations` prints them one by one.
<!-- engine-provenance -->

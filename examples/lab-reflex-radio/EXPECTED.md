# lab-reflex-radio — expected behaviour

## Circuit
- 9 V battery. A short antenna (1 m effective height, a fifth of the other radio benches' wire) on the tap of the ferrite-rod coil; the coil's cold end and the earth on ground; the tuning capacitor across the coil (authored at 0.50, the 612 kHz station).
- The coupling winding feeds the transistor's base. Its other end is biased from 9 V through 470 kΩ and held at RF by 100 nF to ground.
- Emitter: 1 kΩ to ground, bypassed by 10 µF for the audio and 100 nF for the carrier.
- Collector: a 2.5 mH choke, then the magnetic earphone to 9 V, with 10 nF from the choke's lower end to ground.
- From the collector, 1 nF takes the amplified carrier to a germanium diode (47 kΩ to ground at its anode). The diode's output, 47 kΩ ‖ 2.2 nF, goes back through 100 nF to the bottom of the coupling winding.

## Observable behaviour
- The 612 kHz station's 400 Hz tone, about 1.3 mA rms through the earphone, from a wire a fifth as long as the crystal set's.
- Knob near 0.265: the 810 kHz station's 600 Hz (then 900 Hz).
- The far 1215 kHz station (knob 0.10) is not clean: the stronger 810 kHz station bleeds through, because a single tuned circuit cannot keep it out once one transistor amplifies everything twice. The earphone plays a mixture.

## The two jobs of one transistor
1. **RF amplifier.** At the carrier the choke is a high impedance (about 10 kΩ at 612 kHz), so the transistor's carrier current builds a large carrier voltage at the collector: the first pass, a gain of several hundred.
2. **Detector.** The amplified carrier reaches the germanium diode through 1 nF. The diode and 47 kΩ ‖ 2.2 nF recover the sound.
3. **Audio amplifier.** The sound goes back through 100 nF into the base circuit. At audio frequencies the choke is almost nothing and the 10 µF bypasses the emitter resistor, so the same transistor amplifies the sound into the earphone: the second pass.

The carrier never reaches the earphone (the 10 nF bypass), and the audio never disturbs the RF stage much (the coupling winding's bottom is held at RF, not at audio).

## Measured on the engine
bw-board 0bc7baf, `test/lab-circuits-7.test.mjs`, knob 0.50 after 40 ms: 400 Hz at 1.33 mA rms; carrier gain from base to collector about 480; the detected audio swings about 0.5 V peak to peak, the earphone end of the choke about 7.3 V.

```assert
# supply, and the top of the tank: the coil shorts it to ground for DC
net vsource_2.pos V 9.00 +-0.01
net ferrite_coil_6.b V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2c62bd5` and `bw-circuit-ui@15b936d` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 37** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-reflex-radio` prints them one by one.
<!-- engine-provenance -->

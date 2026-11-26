# lab-am-voice-dual-gate — expected behaviour

## Circuit
- 9 V battery. Carrier: a Meissner oscillator — ferrite-rod coil with the tuning capacitor (0.30) in the collector of an NPN, the coupling winding to a 22 kΩ / 22 kΩ divider held by 1 nF, emitter 1 kΩ with 1 nF.
- Modulator: a depletion-mode dual-gate MOSFET. 2.2 pF and 100 pF divide the oscillator's collector swing onto gate 1 (100 kΩ to ground); source 220 Ω with 100 nF; drain into a second ferrite rod with its tuning capacitor (0.30), damped by 2.2 kΩ, from 9 V.
- Gate 2: a 100 kΩ bias pot (authored 0.10, near the channel's pinch-off) through 10 kΩ, and the LM386 (gain 200, 10 µF across pins 1–8) bringing the speaker-microphone's sound (`soundDb` 100, a 500 Hz tone) through 100 nF.
- Receiver: a third ferrite rod (`linkTo` the modulator's rod, 0.5 m) with its tuning capacitor at 0.30, a germanium diode into 47 kΩ ‖ 2.2 nF and a crystal earphone.

## Observable behaviour
- Gate 1 carries about 0.12 V of carrier; the MOSFET drives about 1.6 V of it into its rod, and the receiver's tank picks up about 0.22 V.
- Silent microphone: the receiver's detector output is steady (500 Hz below 2 mV).
- Sound at the microphone: gate 2 swings with it, the MOSFET's gain follows, and the carrier is amplitude-modulated — the receiver's detector carries about 20 mV of the 500 Hz tone, some fifteen times more.
- The bias pot on gate 2 sets the carrier level (and how strongly the sound modulates it): turned lower the channel nears pinch-off and less carrier gets through.

## Measured on the engine
bw-board b094eb22, `test/lab-circuits-r7b.test.mjs` (4 ms after 6 ms): silent gate1 0.120 V, drain 1.58 V, receiver 0.221 V, 500 Hz 0.0013 V; at 100 dB drain 1.64 V, receiver 0.237 V, 500 Hz 0.0195 V. At build time, pot 0.06 gave 0.95 V at the drain and pot 0.40 1.71 V.

## What this verifies
1. A dual-gate MOSFET multiplies: the RF on one gate, the gain set by the other.
2. Driving the gain with sound amplitude-modulates the carrier: a voice transmitter.

```assert
# power-on: supply and the LM386 at half the supply
net vsource_2.pos V 9.00 +-0.01
net lm386_25.bypass V 4.50 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **19 of this page's 40** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-am-voice-dual-gate` prints them one by one.
<!-- engine-provenance -->

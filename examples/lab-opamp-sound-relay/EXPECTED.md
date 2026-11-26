# lab-opamp-sound-relay — expected behaviour

## Circuit
- 9 V supply. A loudspeaker (speaker_3) is the microphone; its sound is a telephone bell (900 Hz strokes), silent as built.
- 1 µF into an NPN common-emitter stage: 47 kΩ / 6.8 kΩ base divider, 4.7 kΩ collector, 470 Ω emitter bypassed by 22 µF.
- 1 µF and 2.2 kΩ into an LM324 inverting stage with 220 kΩ feedback; its + input on half the supply (10 kΩ / 10 kΩ, 1 µF).
- 1 µF and two 1N4148 pump its output through 47 kΩ into 2.2 µF (220 kΩ drains it): the envelope.
- A second LM324 section compares the envelope (+) with the SENSITIVITY pot (potentiometer_24, 2.25 V as built) and drives an NPN through 4.7 kΩ; the relay (200 Ω coil, flyback diode) switches a lamp.

## Observable behaviour
- Silence and a soft ring (70 dB): relay out, lamp dark (amplifier output 2.2 V pp at 70 dB, envelope 1.2 V).
- A loud ring (85 dB): the relay pulls in about 75 ms later and the lamp lights.
- Silence again: the relay drops out about 0.1 s later.

## Measured on the engine
bw-board d4113b4b, `test/lab-circuits-r6h.test.mjs`: envelope peak in the first 100 ms 1.153 V; 70 dB: output 2.218 V pp, envelope 1.217 V, relay out; 85 dB: relay in after 75 ms, lamp 0.998; relay out 100 ms after the sound stops.

## What this verifies
1. A transistor stage and an op-amp stage give the several-thousandfold gain a loudspeaker-microphone needs.
2. Rectifying and smoothing turns a sound into a level; a comparator turns the level into a decision.

## Simulation notes
The amplifiers settle for about 30 ms after switch-on (the coupling and bypass capacitors start empty); the 47 kΩ before the envelope capacitor keeps that settling below the threshold. The scenario rings from 100 ms on, within the bell's first one-second burst.

```assert
# 1 ms after switch-on (the solve assert-physics runs): bias still charging, relay out
net lm324_12.2_neg V 2.25 +-0.01
net lm324_12.1_pos V 0.816 +-0.03
net npn_26.collector V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **19 of this page's 34** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-sound-relay` prints them one by one.
<!-- engine-provenance -->

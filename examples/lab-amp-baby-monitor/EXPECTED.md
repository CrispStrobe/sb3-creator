# lab-amp-baby-monitor — expected behaviour

## Circuit
- 9 V supply. A loudspeaker in the nursery is the microphone (a voice at 60 dB SPL as built); it also hears the earphone at a distance (100 cm as built).
- Two self-biased common-emitter stages (10 kΩ collector, 1 MΩ from collector to base, 220 nF coupling; the second with 1 kΩ in its emitter) and the LM386 (gain 20) through 1 µF.
- The output drives a 250 Ω magnetic earphone on long leads through 100 µF.

## Observable behaviour
- In the next room (100 cm) the earphone plays what the speaker hears.
- Carried back to within a few centimetres of the speaker, the sound it makes is picked up louder than it started and goes round again: the loop howls at full swing, a high whistle near 9.6 kHz.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: after 600 ms of silence the stages sit at 4.82 V and 5.02 V and the output at 4.49 V with 0.001 V of swing; a voice at 60 dB with the earphone 100 cm away: 2.72 V pp at the output; earphone moved to 3 cm: a howl of 7.2 V pp at about 9.6 kHz.

## What this verifies
1. A loudspeaker works as a microphone.
2. Acoustic feedback: when the loop gain through air exceeds one, the system oscillates.

## Simulation notes
The first stages take a few hundred milliseconds to settle after switch-on (1 MΩ bias into 220 nF); the test lets them settle in silence first.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_5.base V 0.015 +-0.02
net npn_5.collector V 4.45 +-0.05
net lm386_14.vout V 8.09 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-baby-monitor` prints them one by one.
<!-- engine-provenance -->

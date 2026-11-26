# lab-amp-ic-baby-monitor — expected behaviour

## Circuit
- 9 V battery, one LM386 at gain 200: 10 µF across pins 1 and 8; pin 7 open; −IN (pin 2) grounded.
- Microphone: a loudspeaker (8 Ω) in the baby's room, hearing a voice at 85 dB SPL (about 200 Hz).
- Sensitivity: a 10 kΩ pot across the speaker's coil; its wiper feeds +IN (pin 3). As authored it is turned fully up.
- Output (pin 5) → 220 µF (+) → magnetic earphone (2 kΩ) → ground: the parents' listening end.

## Observable behaviour
- The speaker's coil makes a fraction of a millivolt; the amplifier lifts it 200 times and the earphone plays the voice.
- Turning the sensitivity pot down feeds the amplifier only part of the coil's voltage: the voice gets proportionally quieter.
- With no sound at the microphone the output sits still at half the supply, 4.5 V.

## Measured on the engine
Output swing (peak to peak) from 30 ms to 40 ms after switch-on:

| sound | sensitivity | output swing |
|---|---|---|
| 85 dB voice | full | 0.117 V |
| 85 dB voice | 0.3 | 0.034 V |
| silent | full | 0.000 V |

## What this verifies
1. A loudspeaker works backwards as a microphone.
2. An LM386 with a capacitor across its gain pins amplifies about 200 times.
3. A pot in front of the amplifier sets how much of the signal it gets: a sensitivity (volume) control.

## Simulation notes
The speaker's EMF is S·p (0.5 mV/Pa); 85 dB SPL is 0.36 Pa. `test/lab-circuits-r6b.test.mjs` reads the output swing at both pot positions and in silence.

```assert
# t = 1 ms: output near half supply (the voice already moves it), the earphone capacitor charging.
net lm386_5.vout V 4.473 +-0.03
net lm386_5.bypass V 4.500 +-0.03
net earphone_8.a V 4.463 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 14** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-baby-monitor` prints them one by one.
<!-- engine-provenance -->

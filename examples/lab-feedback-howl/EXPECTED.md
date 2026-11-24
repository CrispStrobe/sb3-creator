# lab-feedback-howl — expected behaviour

## Circuit
- 9 V supply. A magnetic earphone (2 kΩ, `earphone_3`) is the microphone, across the LM386's +IN and ground. The LM386's gain is set by 10 µF in series with a 10 kΩ volume pot across pins 1 and 8: turned fully up (as authored) the gain is 200.
- The output drives an 8 Ω loudspeaker (`speaker_8`) through 220 µF.
- The earphone hears the speaker (`hears`) from `distanceCm` = 3 cm. The **Distance** slider in the instruments column moves it.

## Observable behaviour
- 3 cm, full gain: within 30 ms the speaker howls at about 390 Hz with its full rated current (level 1); the amplifier swings from rail to rail.
- 20 cm, full gain: the switch-on thump dies away and the output sits still at 4.5 V.
- 3 cm with the volume pot at half: no howl either.
- The loop gain is earphone sensitivity (3 mV/Pa) × speaker output (1 Pa at 1 m per ampere) / distance × amplifier gain / 8 Ω. Above one it howls: with gain 200 that means closer than about 7 cm.

## Measured on the engine
bw-board r4/transducers-20261123, `test/lab-circuits-8.test.mjs`.

| distance | volume | after 30–60 ms |
|---|---|---|
| 3 cm | full | howl, ≈ 387 Hz, level 1 |
| 20 cm | full | quiet (output swing < 50 mV) |
| 3 cm | half | quiet |

## What this verifies
1. An earphone is also a microphone; sound pressure falls with distance.
2. A loop with gain above one oscillates by itself (positive feedback); the amplifier's clipping limits it.

## Simulation notes
The coupled pressure is K·i(t − r/c)/r_eff from the speaker's coil current: the sound takes 29 µs per cm to arrive, and r_eff levels off at the cone's radius (2.5 cm) when the earphone is pressed against it. Sensitivities are order-of-magnitude values, flat across the band.

```assert
# power-on: supply and the LM386's bias divider
net vsource_2.pos V 9.00 +-0.01
net lm386_4.bypass V 4.50 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@489ca7c` and `bw-circuit-ui@7f98562` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 15** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-feedback-howl` prints them one by one.
<!-- engine-provenance -->

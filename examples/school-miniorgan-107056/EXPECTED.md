# OPITEC transistor miniorgan

Source: [OPITEC 107056, manufacturer manual, circuit on page 2](https://www.opitec.com/de-de/opitec-elektronik-miniorgel/107056).

BC548 NPN and BC558 PNP form the actual feedback oscillator, with 3.3 nF, 10 nF, a 1 MΩ base bleed, 180 kΩ series resistor and eight 1 MΩ rheostats and keys. The manual's parts list says 150 kΩ, but its schematic and assembly use 180 kΩ; this example follows the schematic. Each trim uses wiper/b; its clipped a terminal remains open. The 9 V source rises over 10 µs to define a finite startup.

The transistor labels identify physical build parts. Their electrical cards are explicitly illustrative exponential models: IS=1e-14 A, BF=100, BR=1, N=1, RB=10 Ω, RC=1 Ω, CJE=10 pF, CJC=4 pF, TF=0.3 ns. They are not measured BC548/558 cards. The speaker is an 8 Ω electrical resistance, not a mechanical/acoustic model.

Requires the bw-board transistor-charge repair (PR663). With matching cards and conditions, Brickwright and ngspice agree on organ frequency and waveform; at 500 kΩ the comparison is about 255.7 Hz and 8.021 V peak. The simulation is monophonic: press one key; simultaneous keys parallel their timing resistances and do not make chords. Release all keys to stop the sustained tone.

Run the circuit and probe the speaker's driven node, using simulator ground as reference. Time/envelope capture reveals narrow switching pulses. Use the spectrum's sampled capture for frequency analysis and captured-waveform replay/WAV (bw-circuit-ui PR102). Replay uses actual samples, removes DC and applies fixed quiet scaling; an envelope is not playable audio. Sampling too slowly can miss the narrow pulses. The largest spectral peak can be a harmonic; use pulse spacing to determine the fundamental. Real kit tuning, loudness and speaker response require physical measurement.

## Initial tuning for the stated model

The eight trimmers are initially set for approximately C4–C5. These settings belong to this generic model; tune the physical kit separately.

| Key | Note | Effective trim | SPICE frequency |
|---|---|---:|---:|
| 1 | C4 | 483.40 kΩ | 261.30 Hz |
| 2 | D4 | 401.37 kΩ | 293.82 Hz |
| 3 | E4 | 331.06 kΩ | 329.93 Hz |
| 4 | F4 | 299.81 kΩ | 349.36 Hz |
| 5 | G4 | 243.16 kΩ | 391.82 Hz |
| 6 | A4 | 192.38 kΩ | 440.80 Hz |
| 7 | B4 | 149.41 kΩ | 493.98 Hz |
| 8 | C5 | 129.88 kΩ | 523.00 Hz |

Supplier qualification: bw-board PR663 implements the matched transistor charge and open-passive guards; bw-circuit-ui PR102 provides sample replay/WAV and PR103 preserves narrow captured pulses in the time display. The consumer must include their qualified revisions.

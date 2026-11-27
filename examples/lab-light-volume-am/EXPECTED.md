# lab-light-volume-am — expected behaviour

## Circuit
- 9 V supply. One NPN is an RC phase-shift oscillator: 4.7 kΩ collector resistor, three 10 nF / 4.7 kΩ sections from collector back to base, 470 kΩ from collector to base for bias.
- Its collector reaches an LM386 through 1 µF and a 1 MΩ / 2.2 kΩ divider. The LM386's gain pins (1 and 8) are bridged by a phototransistor in series with 10 µF. The loudspeaker (8 Ω) hangs on the output through 220 µF.
- Half 1 of an LM358 is a square-wave generator (three 100 kΩ at its + input, 47 kΩ / 470 nF timing); its output drives an IR LED through 470 Ω. The IR LED faces the phototransistor 2 cm away (a light path with a distance knob, 1 to 20 cm). The second LM358 half is unused.

## Observable behaviour
- The oscillator runs at about 1.1 kHz with a swing of about 8.6 V peak to peak.
- While the LM358's output is high (about 6.9 V) the IR LED shines, the phototransistor conducts, the LM386 runs at high gain and the speaker gets about 2.8 V peak to peak.
- While it is low the LED is dark, the gain falls to its minimum and the speaker gets about 0.37 V peak to peak.
- The modulator switches about 30 times a second: the tone throbs. More room light on the phototransistor (its light slider) or a shorter light path makes it louder overall.

## Measured on the engine
25–30 ms (modulator high): oscillator 1099 Hz, 8.64 V peak to peak; speaker 2.78 V peak to peak. 37–42 ms (modulator low): speaker 0.37 V peak to peak, a ratio of about 7.6. `test/lab-circuits-r6d.test.mjs` holds these.

## Why
The LM386 sets its gain by what is connected between pins 1 and 8: nothing gives the minimum, a capacitor the maximum. A phototransistor in that path lets light choose between the two. The tone itself never changes; only how much of it gets through, so the light's on-off pattern is printed onto the tone's loudness: amplitude modulation.

## Simulation notes
The modulator runs much faster than a visible blink so that one test can see both of its halves in 50 ms; this bench costs several seconds of computing time per simulated millisecond.

## What this verifies
1. One transistor and three RC sections make a sine oscillator.
2. The gain of the LM386 can be controlled by light, so a flashing IR LED amplitude-modulates the tone.

```assert
# t = 1 ms: modulator high, oscillator starting
net vsource_2.pos V 9.00 +-0.01
net lm358_19.1_out V 6.87 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **21 of this page's 27** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-light-volume-am` prints them one by one.
<!-- engine-provenance -->

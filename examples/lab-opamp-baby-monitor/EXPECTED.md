# lab-opamp-baby-monitor — expected behaviour

## Circuit
- 9 V supply. Section 4 of an LM324 buffers the midpoint of 10 kΩ / 10 kΩ (half the supply, with 1 µF).
- The loudspeaker in the nursery (speaker_3) is the microphone, between the midpoint and the first stage's input.
- Sections 1 and 2: inverting amplifiers, 1 kΩ in through 4.7 µF, 100 kΩ back: ×100 each.
- Section 3: 10 kΩ in, 10 kΩ back (×1); GAIN (switch_17) puts 1.1 kΩ beside its input resistor (×10). Total 10^4 or 10^5.
- Earphone in the listening room (earphone_21) through 10 µF and 1 kΩ; red LED (led_23) from the output to the midpoint.

## Observable behaviour
- Quiet nursery: the output stays at 4.5 V (4 mV of residue).
- Speech at 50 dB at the loudspeaker (a few microvolts): 0.11 V pp at the output with GAIN open, 1.14 V pp with it closed.
- 20 dB quieter speech at GAIN ×10^5 gives the same 0.11 V pp as 50 dB at ×10^4.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: 0.113 V pp (50 dB, 10^4), 1.144 V pp (50 dB, 10^5), 0.115 V pp (30 dB, 10^5).

## What this verifies
1. Gains in cascade multiply: 100 × 100 × 10 = 10^5.
2. A loudspeaker makes a microphone with a few microvolts per decibel-scale step; 20 dB is a factor of ten in voltage.

## Simulation notes
The loudspeaker's microphone sensitivity is the engine's 0.5 mV/Pa; 50 dB SPL is 6.3 mPa, about 3 µV. Each stage's gain-bandwidth (1 MHz / 100 = 10 kHz) is ample for speech.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_4.4_out V 0.816 +-0.02
net resistor_5.b V 0.816 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 22** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-baby-monitor` prints them one by one.
<!-- engine-provenance -->

# lab-radio-whistle — expected behaviour

## Circuit
- A crystal set: ferrite coil with the tuning capacitor across it (authored at 0.51), cold end and earth on ground, germanium diode into 47 kΩ ‖ 2.2 nF and a crystal earphone.
- A slide switch connects the antenna either to the coil's tap (left, as authored) or to its top (right).
- The antenna carries its own broadcast (the `stations` parameter), three stations:
  - "local", 612 kHz, a 400 Hz tone;
  - "neighbour", 621 kHz, half as strong, carrier only (a station between programmes);
  - "far", 702 kHz, as strong as the local one, a 1 kHz tone.

## Observable behaviour
- Tuned to the local station with the antenna on the tap: its 400 Hz tone, and on top of it a thin, high whistle. The whistle is 9 kHz, exactly the distance between the local and the neighbouring carrier: both reach the diode, and two carriers 9 kHz apart add up to a signal whose strength rises and falls 9000 times a second. The diode recovers that as a tone.
- Take the neighbour off the air (delete it from the antenna's stations) and the whistle is gone.
- The far station's 1 kHz tone is nearly absent: 90 kHz away, the tank rejects it.
- Slide the switch to the top of the coil. The antenna's own capacitance now sits across the whole tank, so the knob has to come down to about 0.10 to find the local station again. It comes in louder, but the tuning is broader: the far station's 1 kHz tone now clearly mixes in.

## Measured on the engine
bw-board 0bc7baf, `test/lab-circuits-7.test.mjs`. Audio components at the detector output (one-bin DFT over 10 ms after 15 ms), and the far station's share of the tank RF:

| antenna | knob | 400 Hz tone | 9 kHz whistle | 1 kHz (far) | far / local in the tank |
|---|---|---|---|---|---|
| tap | 0.51 | 0.225 V | 0.024 V | 0.0018 V | 0.16 |
| tap, neighbour off | 0.51 | 0.220 V | 0.00001 V | 0.0026 V | 0.13 |
| top | 0.10 | 0.330 V | 0.049 V | 0.026 V | 0.47 |

The whistle sits about a tenth below the tone: the 2.2 nF capacitor is there to smooth away fast signals, and 9 kHz is fast. The selectivity price of the top connection shows in the far station: from under 1 % of the local tone to 8 %.

## What this verifies
1. Two carriers close together beat: the difference frequency appears as a whistle (the reason broadcast stations keep a fixed channel spacing).
2. Selectivity depends on how hard the antenna loads the tank: a tap trades loudness for sharpness.

```assert
# the top of the tank sits at ground for DC (the coil shorts it)
net tuning_cap_7.a V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@7e0bf8c` and `bw-circuit-ui@cb8dbb7` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **2 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-radio-whistle` prints them one by one.
<!-- engine-provenance -->

# lab-voice-canceller — expected behaviour

## Circuit
- 9 V supply. Three signal generators stand for a stereo recording, each 1 V amplitude around 4.5 V: a **voice** (300 Hz) recorded in the middle, so it is in both channels; a **guitar** (110 Hz) only on the left; a **flute** (660 Hz) only on the right.
- Left channel: voice and guitar through 10 kΩ each; right channel: voice and flute through 10 kΩ each. Op-amps 1 and 2 of an LM324 buffer them.
- Op-amp 3 is a difference amplifier (four 10 kΩ; the + side returned to 4.5 V buffered by op-amp 4): left − right.
- **CANCEL** (slide switch) picks what the crystal earphone hears through 10 µF: the left channel (as authored) or the difference. The oscilloscope shows left (channel 1) and the selection (channel 2).

## Observable behaviour
- Voice alone: the left channel carries it (1.0 V peak-to-peak); the difference is silent.
- Guitar and flute: they come through the difference (about 2 V peak-to-peak together), because each is in only one channel.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: with only the voice, left 0.998 V p-p and the difference 0.000002 V p-p; with only the instruments, the difference 1.96 V p-p.

## What this verifies
1. What is the same in both inputs of a difference amplifier cancels (common-mode rejection).
2. A voice mixed to the middle of a stereo recording is exactly such a common signal; instruments panned to one side are not.

## Simulation notes
The generators are ideal and the resistors equal, so the cancellation is perfect; on a real record reverb and unequal mixing leave some voice behind.

```assert
# the 4.5 V reference the difference amplifier returns to
net lm324_10.4_out V 4.50 +-0.01
net resistor_11.b V 4.50 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 16** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-voice-canceller` prints them one by one.
<!-- engine-provenance -->

# lab-fibre-morse-music — expected behaviour

## Circuit
- 9 V supply. Transmitter: a two-transistor astable (`npn_6`, `npn_7`; 1 kΩ collectors, 47 nF cross-coupling, 22 kΩ base resistors) is powered through the Morse key (`button_3`).
- A slide switch (`slide_switch_13`) picks the source: position 0 the astable's collector, position 1 a music player (`function_gen_12`, 440 Hz sine, 0.5 V amplitude).
- The source reaches the modulator transistor (`npn_20`) through 1 µF and 10 kΩ; its base is biased by 47 kΩ / 10 kΩ, its emitter has 220 Ω. The red LED (`led_19`, 220 Ω) is its collector load, so the LED's light follows the signal.
- A 2 m light guide (`light_path_29`, knob = the air gap at the far end, 0 to 20 mm) carries the light to a phototransistor (`phototransistor_22`, 220 Ω emitter resistor).
- Receiver: 47 nF couples the emitter into an LM386 (`lm386_25`, gain 20, 1 µF on BYPASS); 220 µF drives the speaker.

## Observable behaviour
- Key up: the LED glows steadily, the speaker is silent.
- Key down: the astable runs at about 680 Hz, the LED flickers with it and the speaker gives the same note. Short and long presses are Morse dots and dashes.
- Slide switch to music: the speaker plays the 440 Hz tune that went into the LED.
- A wider air gap at the end of the guide makes the music quieter.

## Measured on the engine
bw-board d4113b4b / bw-circuit-ui 0b594d6, `test/lab-circuits-r6i.test.mjs`.

| condition | quantity | value |
|---|---|---|
| key up | phototransistor emitter, peak to peak | 0.005 V |
| key down | astable / speaker tone | 677 Hz / 676 Hz |
| key down | LM386 output, peak to peak | 7.17 V |
| music | speaker tone | 440 Hz |
| music | LM386 output, peak to peak | 1.70 V |
| music, 10 mm air gap | LM386 output, peak to peak | 0.20 V |

## What this verifies
1. The LED's current, and with it its light, follows the modulator's base: an on-off square from the astable, a sine from the music player.
2. The light guide carries the waveform unchanged; only its size depends on the path.
3. The LM386 restores the level for the speaker: the far end plays the same frequency the near end sent.

## Simulation notes
The assert block reads the operating point 1 ms after power-on with the key up, while the 1 µF coupling capacitor is still charging; the numbers are that instant, not the final bias. Each 1 ms of the keyed astable costs about a second of wall time, so the scenario test keeps to tens of milliseconds.

```assert
# t = 1 ms, key up, slide switch on the astable
net npn_20.emitter V 0.434 +-0.03
net phototransistor_22.emitter V 0.131 +-0.015
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 28** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-fibre-morse-music` prints them one by one.
<!-- engine-provenance -->

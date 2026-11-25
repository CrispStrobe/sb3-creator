# lab-lens-beam-link — expected behaviour

## Circuit
- 9 V supply. Transmitter: an LM386 (`lm386_3`, pins 1 and 8 joined) as a relaxation oscillator (1 MΩ from +9 V and 1 MΩ from the output on its + input; 220 kΩ and 22 nF from the output on its − input, about 1 kHz) flashes a red LED (`led_9`) through 220 Ω.
- A lens (focal length 5 cm, 2 cm radius) 5.1 cm in front of the LED gathers its light into a narrow beam. The distance to the receiver is the knob of the light path (`light_path_22`, air, 50 to 500 cm, 300 cm as built).
- Receiver: a phototransistor (`phototransistor_10`) with 10 kΩ on its emitter; 100 nF couples it to two transistor stages in a row (`npn_15`, `npn_19`, each with 1 MΩ from collector to base and 10 kΩ load), and 1 µF couples the second to a magnetic earphone.

## Observable behaviour
- At 3 m with the lens the phototransistor's emitter swings 0.14 V with the flashes and the earphone plays the 1 kHz tone loudly.
- The same 3 m without the lens: a swing of only 0.012 V, about a tenth.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, values at about the stated settings (a sequence or a waveform swing, which no single solve stands in for).

| at 3 m | phototransistor swing | second stage swing |
|---|---|---|
| with the lens | 0.137 V | several volts |
| without (lensFocalCm 0) | 0.012 V | 3.3 times smaller |

## What this verifies
1. Light from a bare LED spreads out and falls off with the square of the distance; a lens that catches the cone and sends it on as a beam keeps much more of it together.
2. Flashing the light lets the receiver use capacitor coupling: the steady room light is ignored and only the 1 kHz flashes are amplified.

## Simulation notes
The lens model (bw-board optics.js) follows the cone it catches to the image the lens equation predicts and gives the receiver the share of the spot that falls on it, including the blur from the LED's 3 mm size. "Without the lens" is the same path with no lens (a test variant).

```assert
# t = 1 ms: oscillator output low, its + input at (9 V + 0.9 V) / 22
net lm386_3.inp V 0.450 +-0.01
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-lens-beam-link` prints them one by one.
<!-- engine-provenance -->

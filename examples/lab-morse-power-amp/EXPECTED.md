# lab-morse-power-amp — expected behaviour

## Circuit
- 9 V battery.
- Tone oscillator: two NPN transistors as an astable multivibrator: 1 kΩ collector resistors, 27 kΩ base resistors, 33 nF cross-coupling capacitors. Its supply goes through the Morse key (a button).
- 100 nF from the second collector into an attenuator: a slide switch picks 220 kΩ (strong attenuation, as authored) or 10 kΩ (weak), into 1 kΩ to ground at +IN of an LM386.
- LM386: −IN grounded, pin 7 open. A second slide switch adds 10 µF + 470 Ω across the gain pins 1 and 8 (more gain); as authored the gain pins are open (gain 20).
- Output → 220 µF (+) → loudspeaker (8 Ω) → ground.

## Observable behaviour
- Key up: silence, the amplifier's output resting at half the supply.
- Key down: a tone of about 780 Hz.
- Strong attenuation, gain 20: a quiet, clean tone with a small output swing.
- Strong attenuation with the gain resistor in: about three times louder.
- Weak attenuation: the amplifier is overdriven: its output swing hits both limits of the amplifier and the tone turns harsh. More gain cannot make it any louder.

## Measured on the engine
Output swing from 12 ms to 16 ms after the key goes down:

| attenuator | gain pins | output range | swing |
|---|---|---|---|
| strong | open | 4.31 – 5.13 V | 0.83 V |
| strong | 10 µF + 470 Ω | 3.47 – 5.93 V | 2.45 V |
| weak | open | 0.93 – 8.04 V | 7.1 V (clipped) |
| weak | 10 µF + 470 Ω | 0.93 – 8.14 V | 7.2 V (clipped) |

Key up: the output stays at 4.50 V. The speaker's pitch with the key down: 783 Hz.

## What this verifies
1. A two-transistor astable makes the tone; the power amplifier only drives the speaker.
2. A resistive divider sets how much signal the amplifier gets; a resistor and capacitor across the gain pins set its gain.
3. Too much signal for the gain overdrives the amplifier: the waveform is clipped at the output limits.

## Simulation notes
`test/lab-circuits-r6b.test.mjs` holds the key down in each switch setting and reads the output range and the speaker's pitch.

```assert
# t = 1 ms, key up: the oscillator has no supply, the amplifier rests at half supply.
net lm386_17.vout V 4.500 +-0.03
net lm386_17.inp V 0.000 +-0.01
net polarized_cap_21.neg V 2.580 +-0.10
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 29** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-morse-power-amp` prints them one by one.
<!-- engine-provenance -->

# lab-amp-ic-siren — expected behaviour

## Circuit
- 9 V battery.
- Slow astable: two NPN transistors, 33 kΩ base resistors, 22 µF cross-coupling electrolytics, 1 kΩ collector resistors. Each collector also lights an LED from the battery through 1 kΩ: red on Q1, blue on Q2.
- Tone oscillator: an LM386 (pins 1, 7, 8 open) as a Schmitt trigger: output → 47 kΩ → +IN, battery → 47 kΩ → +IN. The 100 nF timing capacitor on −IN charges from the output through 10 kΩ and discharges quickly through a 1N4148 and 1 kΩ.
- Modulation: Q2's collector → 1N4148 → 2.2 kΩ → 22 kΩ pot (as a variable resistor, authored at half) → −IN. While Q2 is off, its collector is high and this path adds charging current to the timing capacitor.
- Output → 47 µF (+) → 47 Ω → loudspeaker → ground.

## Observable behaviour
- The two LEDs alternate about once a second (each about half a second).
- The tone switches with them: about 940 Hz while blue is lit (Q2 on, the diode blocks), about 1.9 kHz while red is lit (Q2 off, extra charging current): a two-tone siren.
- The pot sets the high tone: less resistance, more extra current, a higher note. The diode keeps the modulation path from pulling the timing capacitor down.

## Measured on the engine
With the astable's capacitors scaled down to 470 nF (so that one phase lasts about 11 ms, not 0.5 s): tone 943–962 Hz while Q2 is on, 1852–1923 Hz while Q2 is off, switching within two tone periods of each phase change.

## What this verifies
1. A slow oscillator can modulate a fast one: the blinker's state changes the tone's charging current.
2. A diode lets a signal act only one way.
3. Charging current sets an RC oscillator's pitch.

## Simulation notes
At the authored values a full siren cycle is about a second of 1–2 kHz tone, which costs the engine real time per edge; `test/lab-circuits-r6b.test.mjs` therefore scales the astable's two capacitors down (22 µF → 470 nF) and checks the two pitches over two phases.

```assert
# t = 1 ms: the tone oscillator's first charging ramp, output high.
net lm386_18.inp V 5.808 +-0.05
net lm386_18.vout V 8.075 +-0.05
net capacitor_24.a V 4.696 +-0.10
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-siren` prints them one by one.
<!-- engine-provenance -->

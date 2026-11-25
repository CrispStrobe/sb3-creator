# lab-amp-metronome — expected behaviour

## Circuit
- 9 V supply. LM386 relaxation oscillator: 47 kΩ from the output and 100 kΩ from +9 V set the + input's threshold, which moves with the output; 1 nF speed-up.
- Timing: 2.2 kΩ plus a 15 kΩ RATE rheostat (potentiometer_8) from the output to the − input; 100 nF from the − input to ground, plus 2.2 µF with ENGINE (switch_10) closed, plus 100 µF with TICK (switch_12) closed (as built: TICK closed, ENGINE open, knob at half).
- Red LED (1 kΩ) on the output; loudspeaker through 47 µF and 47 Ω.

## Observable behaviour
- TICK: the output changes every 0.18 s with the knob up and every 1.2–1.7 s with it down (period 0.36 s to 2.9 s); the speaker ticks at each change, the LED blinks once a period.
- ENGINE alone: period 8.4 ms (knob up, a buzz of about 120 Hz) to 67 ms (knob down, a putter of about 15 a second).
- Neither: a tone of about 2.7 kHz with the knob up, falling to about 340 Hz with it down: a siren by hand.

## Measured on the engine
bw-board d4113b4b, `test/lab-circuits-r6h.test.mjs`: periods 0.373 ms and 2.937 ms (100 nF, knob up/down), 8.367 ms and 67.33 ms (ENGINE), 362.7 ms and 2925 ms (TICK).

## What this verifies
1. The period of an RC relaxation oscillator scales with C: 100 nF → 2.2 µF → 100 µF moves it by about 22 and 1000 times (0.373 → 8.37 → 363 ms).
2. The knob's resistance range (2.2 kΩ to 17.2 kΩ) spans about a factor of 8 at each speed.

## Simulation notes
The LM386 has 50 kΩ from each input to ground, so the − input can charge at most to 8.1 V × 50 k / (50 k + R): above about 27 kΩ it never reaches the upper threshold and the oscillator stops. That is why the timing resistance stays at or below 17.2 kΩ and the slow speeds come from large capacitors. The slow end is not proportional: near the limit the charge creeps towards the threshold, so knob down gives 8× the period for 7.8× the resistance.

```assert
# 1 ms after switch-on (the solve assert-physics runs): the 100 µF still empty, output high
net lm386_3.vout V 8.07 +-0.03
net lm386_3.inp V 5.11 +-0.02
net led_15.anode V 1.71 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 39** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-metronome` prints them one by one.
<!-- engine-provenance -->

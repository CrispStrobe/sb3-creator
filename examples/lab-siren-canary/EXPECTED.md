# lab-siren-canary — expected behaviour

## Circuit
- 9 V supply. **Ramp:** op-amp 1 of an LM324 is a slow astable (three 100 kΩ set its two thresholds, 100 kΩ into 4.7 µF); its capacitor voltage is the ramp.
- **MODE** (slide switch): siren (as authored) leaves it so, the capacitor climbs and falls alike; canary adds a 1N4148 and 1 kΩ across the timing resistor, so the capacitor drops back almost at once and only the climb remains.
- Op-amp 2 (10 kΩ feedback, 10 kΩ to a 3.9 kΩ / 2.2 kΩ divider) stretches the ramp to nearly twice its height.
- **Tone:** a transistor multivibrator (two NPN, 2.2 kΩ collectors, 22 nF cross capacitors) whose 47 kΩ base resistors return to that stretched ramp: a higher return charges the capacitors back faster, a higher pitch.
- **SOUND** switch between the stretching op-amp and the base resistors (100 kΩ to ground behind it): open, the transistors get no base current and stay silent. 470 Ω and 47 µF couple the tone into an 8 Ω loudspeaker.

## Observable behaviour
- Siren: the pitch glides up for about 380 ms and down for about 285 ms, over and over.
- Canary: it glides up for 378 ms and snaps back in 3 ms: a chirp, again and again.
- Bottom of the ramp about 551 Hz, top about 726 Hz.

## Measured on the engine
`test/lab-circuits-r6e.test.mjs`: siren climb 380 ms, fall 285 ms; canary climb 378 ms, drop 3 ms (ramp watched with SOUND off). Pitch at the bottom 551 Hz with the base return at 3.03 V, at the top 726 Hz at 7.14 V (SOUND on for 10 ms at each point).

## What this verifies
1. A slow oscillator can steer a fast one: a voltage-controlled oscillator.
2. In a multivibrator the base resistors' return voltage sets how fast the cross capacitors recover, and so the pitch.
3. A diode that bypasses the timing resistor in one direction turns a triangle-like ramp into a sawtooth.

## Simulation notes
The SOUND switch is there so the tone can be paused; the test uses it to watch the slow ramp without simulating every cycle of the tone (a multivibrator at audio rates costs real time per simulated millisecond).

```assert
# 1 ms after switch-on: the ramp's output high, the capacitor still empty,
# the stretching stage at the bottom of its range
net lm324_3.1_out V 7.50 +-0.05
net lm324_3.1_pos V 5.50 +-0.05
net resistor_12.b V 3.03 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-siren-canary` prints them one by one.
<!-- engine-provenance -->

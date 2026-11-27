# lab-amp-ic-chirp — expected behaviour

## Circuit
- 9 V battery.
- Slow astable: NPN Q1 and Q2, 2.2 kΩ collector resistors, 100 kΩ base resistors, 22 µF (Q1's collector to Q2's base) and 2.2 µF (Q2's collector to Q1's base) electrolytics: Q2 stays off for a long phase and on for a short one.
- Kick: Q2's collector drives the base of a third NPN, Q3, wired as an emitter follower (collector to the battery, 2.2 kΩ from emitter to ground), so the kick does not load the astable. Q3's emitter → 22 µF → node K. K has 10 kΩ to ground and a 1N4148 clamp (anode at ground) that stops it going more than one diode drop below ground.
- Tone oscillator: an LM386 (pins 1, 7, 8 open) as a Schmitt trigger: output → 47 kΩ → +IN, battery → 47 kΩ → +IN. The 100 nF timing capacitor on −IN charges from the output through 4.7 kΩ and a 10 kΩ pitch pot (as a variable resistor) and discharges fast through a 1N4148 and 1 kΩ.
- Gate: a 1N4148 from −IN (anode) to K. While K is low it holds the timing capacitor below the upper switching point: no tone.
- Injection: a 1N4148 from K through 4.7 kΩ into −IN adds charging current while K is high.
- Output → 47 µF (+) → 47 Ω → loudspeaker → ground.

## Observable behaviour
- Silence most of the time.
- Each time Q2 switches off, its collector rises and the capacitor lifts K by several volts: the gate opens, and the extra charging current makes the tone start high and climb while the kick builds. As the 22 µF charges through 10 kΩ, K falls: the pitch glides down, and once K is too low the gate closes again. One short falling whistle: a chirp.
- The astable repeats this every couple of seconds; the first chirp comes right at switch-on and, because the capacitors start empty, the second one already about 0.3 s later.

## Measured on the engine
Tone edges from the speaker side of the amplifier, sampled every 50 µs:

| | first chirp (switch-on) | second chirp |
|---|---|---|
| Q2's collector rises | 3 ms | 303.9 ms |
| tone starts | 5.1 ms | 304.5 ms |
| highest pitch | 2.5 kHz | 3.3 kHz |
| pitch at the end | 1.1 kHz | 1.05 kHz |
| tone ends | 79 ms | 394 ms |

No tone edge at all between 90 ms and 300 ms, nor after the second chirp up to 700 ms; Q2 is still off at 700 ms (its long phase, set by 100 kΩ × 22 µF, is about 1.5 s; the first phase after switch-on is short because the capacitors start empty).

## What this verifies
1. A capacitor passes an edge as a short pulse that decays: a kick.
2. A diode clamp can gate an oscillator; a second diode can inject current into its timing capacitor.
3. A decaying charging current makes a falling pitch.

## Simulation notes
The emitter follower Q3 matters: driving the 22 µF straight from Q2's collector slowed the collector's rise so much that the astable lost its long phase. `test/lab-circuits-r6b.test.mjs` runs the authored bench to 330 ms and checks both chirps and the silence between them.

```assert
# t = 1 ms: switch-on, Q2's collector rising, the follower and K following it.
net npn_11.base V 2.274 +-0.10
net capacitor_13.a V 1.597 +-0.10
net capacitor_24.a V 2.157 +-0.10
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 40** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-chirp` prints them one by one.
<!-- engine-provenance -->

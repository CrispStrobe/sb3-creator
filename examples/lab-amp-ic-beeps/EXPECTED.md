# lab-amp-ic-beeps — expected behaviour

## Circuit
- 9 V battery.
- Slow astable: two NPN transistors, 47 kΩ base resistors, 10 µF cross-coupling electrolytics. Q1's collector has a plain 2.2 kΩ load; Q2's collector lights a green LED from the battery through 1 kΩ.
- Tone oscillator: an LM386 (pins 1, 7, 8 open) as a Schmitt trigger: output → 47 kΩ → +IN, battery → 47 kΩ → +IN; 10 kΩ from the output to −IN, 100 nF from −IN to ground.
- Gate: a 1N4148 from −IN (anode) to Q1's collector (cathode).
- Output → 47 µF (+) → 47 Ω → loudspeaker → ground.

## Observable behaviour
- While Q1 is on, its collector is near 0 V and the diode holds the timing capacitor at about 0.7 V, far below the lower switching point: the output stays high and the speaker is silent. The green LED is dark (Q2 is off).
- While Q1 is off, the diode blocks and the tone runs at about 690 Hz; Q2 is on and the green LED is lit.
- The result is a busy signal: beep (green) – pause – beep, each about 0.3 s.

## Measured on the engine
With the astable's capacitors scaled down to 220 nF (phases of about 6.4 ms instead of about 0.3 s): tone periods of 685–694 Hz only in the phases with Q1 off, no output edge at all in the phases with Q1 on.

## What this verifies
1. A diode can switch an oscillator off by clamping its timing capacitor.
2. A slow oscillator gating a fast one makes beeps: the tone is fully on or fully off.

## Simulation notes
`test/lab-circuits-r6b.test.mjs` scales the astable's two capacitors down (10 µF → 220 nF) so that several beeps fit into a few tens of milliseconds, then checks that tone edges fall only into the gated-on phases.

```assert
# t = 1 ms: output high, the timing capacitor charging.
net lm386_13.inp V 5.808 +-0.05
net lm386_13.vout V 8.075 +-0.05
net capacitor_17.a V 1.714 +-0.10
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2c62bd5` and `bw-circuit-ui@15b936d` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 21** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-beeps` prints them one by one.
<!-- engine-provenance -->

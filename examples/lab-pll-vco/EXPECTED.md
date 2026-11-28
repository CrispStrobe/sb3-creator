# lab-pll-vco — expected behaviour

## Circuit
- 9 V supply. A 4046 PLL (`cd4046_4`) used only as its voltage-controlled oscillator: R1 = 47 kΩ from pin R1 to ground, R2 = 220 kΩ from pin R2 to ground, C1 = 10 nF between C1A and C1B, INHIBIT on ground.
- A 10 kΩ potentiometer (`potentiometer_3`) across the supply sets VCO_IN.
- VCO_OUT drives an NPN (`npn_9`) through 4.7 kΩ; the speaker (8 Ω) with 100 Ω in series sits in its collector, with a flyback diode across both.

## Observable behaviour
- The pot sets the pitch: from 114 Hz with the wiper at ground to 1178 Hz at the top.
- The frequency rises in a straight line with the control voltage: 118 Hz per volt.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, 12 ms after switch-on, values at about the stated settings (a sequence or a waveform swing, which no single solve stands in for).

| pot | VCO_IN | VCO |
|---|---|---|
| 0.2 | 1.80 V | 326.6 Hz |
| 0.8 | 7.20 V | 964 Hz |

f = V(VCO_IN) / (2 · 47 kΩ · 10 nF · 9 V) + 4.5 V / 220 kΩ / (2 · 10 nF · 9 V) = 118.2 Hz/V · V + 113.6 Hz.

## What this verifies
1. The 4046's oscillator charges C1 with a current set by R1 and the control voltage (plus a fixed share through R2); the frequency is proportional to that current.
2. R2 sets the lowest frequency, R1 the span.

## Simulation notes
The cd4046 model (bw-board pll-4046.js) runs its VCO on the external R1, R2 and C1, so changing them changes the pitch. The transistor stage costs most of the simulation time: every edge of the square wave switches it.

```assert
# t = 1 ms, pot at half: VCO_IN = 4.5 V, pin R1 follows it
net cd4046_4.vco_in V 4.50 +-0.01
net cd4046_4.r1 V 4.50 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-pll-vco` prints them one by one.
<!-- engine-provenance -->

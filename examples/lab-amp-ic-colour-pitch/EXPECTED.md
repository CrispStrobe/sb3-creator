# lab-amp-ic-colour-pitch — expected behaviour

## Circuit
- 9 V battery, one LM386 (pins 1, 7, 8 open) as a Schmitt-trigger tone oscillator:
  - positive feedback: output → 47 kΩ → +IN, battery + → 100 kΩ → +IN (with the chip's own input resistance to ground): +IN sits higher while the output is high than while it is low;
  - the timing capacitor on −IN, selected by a slide switch: 100 nF (as authored) or 470 nF;
  - charging path: output → 4.7 kΩ → an LED → −IN. A second slide switch picks the red LED (as authored) or the green one;
  - discharging path: −IN → 1N4148 → 4.7 kΩ → output (the LED blocks this direction).
- Output → 47 µF (+) → 47 Ω → loudspeaker → ground.

## Observable behaviour
- A steady tone; the LED in the charging path glows with it.
- Switching from the red to the green LED lowers the note by about a tenth: the green LED needs more forward voltage, so less voltage is left to charge the capacitor and it takes longer to reach the upper switching point.
- The larger capacitor makes the note much lower (about a fifth of the frequency).

## Measured on the engine
Speaker pitch from 8 ms to 20 ms after switch-on:

| LED | capacitor | pitch |
|---|---|---|
| red | 100 nF | 878 Hz |
| green | 100 nF | 795 Hz |
| red | 470 nF | 182 Hz |

## What this verifies
1. An LED's forward voltage depends on its colour (green above red).
2. In an RC oscillator the voltage left over for charging sets the time: a larger drop in the charging path means a lower note.
3. A larger capacitor lowers the pitch.

## Simulation notes
The LM386 model's output is Vs/2 + 20·(v+ − v−) inside 0.9 V .. 8.1 V, so the divider to +IN gives it hysteresis. `test/lab-circuits-r6b.test.mjs` reads the pitch from the speaker for each switch setting.

```assert
# t = 1 ms: mid-oscillation, output low, the capacitor discharging.
net lm386_3.vout V 0.905 +-0.05
net lm386_3.inp V 2.131 +-0.05
net diode_10.anode V 3.739 +-0.10
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-colour-pitch` prints them one by one.
<!-- engine-provenance -->

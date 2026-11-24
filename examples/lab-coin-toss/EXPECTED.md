# lab-coin-toss — expected behaviour

## Circuit
A 5 V supply (the flip-flop is a 74HC part).

- **Clock:** a 555 astable with 4.7 kΩ, 22 kΩ and 1 µF, about 30 Hz. Its
  reset pin is held low by 10 kΩ, so it only runs while the **hold to toss**
  button lifts reset to 5 V. The control pin has its usual 10 nF to ground.
- **Coin:** one half of a 74HC74 D flip-flop. Its inverted output Q̄ is fed back
  to D, so every rising clock edge flips it. Preset and clear are tied high
  (inactive).
- **Faces:** Q lights the red "heads" LED, Q̄ the green "tails" LED, each through
  330 Ω.

## Expected behaviour
- Power-on: the flip-flop starts with Q low — tails (green) is lit.
- Holding the button: the clock runs and the flip-flop toggles about fifteen
  times a second. Both LEDs flicker; over a long hold each is lit half the
  time.
- Releasing: the 555 is reset, its output goes low (a falling edge, which the
  flip-flop ignores) and the coin freezes on whichever face it showed last.
  That face stays lit until the next toss.
- The result depends only on how long the button was held, to within a few
  hundredths of a second. Nobody can time a press that precisely, which is
  what makes the outcome unpredictable. The simulator itself is deterministic:
  the same hold time always gives the same face.

## Measured on the engine
Five tosses in a row, each hold followed by half a second of rest (driven by
`test/lab-circuits-1.test.mjs`). The 555's timing capacitor keeps part of its
charge between tosses, so each result also depends on the tosses before it:

| toss | hold, milliseconds | face after release |
|---|---|---|
| 1 | 300 | heads |
| 2 | 320 | heads |
| 3 | 340 | heads |
| 4 | 360 | tails |
| 5 | 380 | heads |

A lit face carries 8.5 mA (red heads) or 7.7 mA (green tails, whose forward
voltage is higher); the other LED carries none.

## What this verifies
1. A flip-flop with its inverted output fed back to D divides by two (toggles).
2. Stopping a fast oscillator at a human-chosen moment samples it at random.

```assert
# power-on: Q low, so tails (Q-bar) is lit, heads dark
net rh.a V 0.00 +-0.05
net rt.a V 4.59 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@489ca7c` and `bw-circuit-ui@7f98562` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 11** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-coin-toss` prints them one by one.
<!-- engine-provenance -->

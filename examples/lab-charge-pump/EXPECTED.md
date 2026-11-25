# lab-charge-pump — expected behaviour

## Circuit
- **Oscillator:** a 555 astable on 9 V with 10 kΩ, 22 kΩ and 1 µF (control pin
  10 nF to ground). Its output is a square wave between about 0 V and 9 V,
  roughly 27 times a second.
- **Pump:** the 555 output drives the lower plate of a 47 µF pump capacitor.
  Its upper plate (node X) is fed from +9 V through diode D1 and passes charge
  on through diode D2 into a 220 µF reservoir capacitor.
- **Load:** a blue LED (it drops about three volts) with 4.7 kΩ across the reservoir. The **heavy load**
  button adds 1 kΩ in parallel.

## Expected behaviour
- Output low: the pump capacitor's lower plate is at ground; D1 charges it to
  about 9 V minus one diode drop.
- Output high: the lower plate jumps up by 9 V and carries the charged upper
  plate with it, to nearly 18 V. D1 now blocks, D2 conducts and tops up the
  reservoir.
- The reservoir settles at about 14.4 V with the LED load — more than the
  battery can give directly. The ideal 2 × 9 V is reduced by two diode drops
  and by the charge the load takes between pump strokes.
- Heavy load pressed: the pump cannot keep up, the output sags to about 8 to
  9 V and ripples strongly at the pump frequency. A charge pump has a high
  output resistance.

## Measured on the engine
Driven by `test/lab-circuits-1.test.mjs` (a free-running 555 is a waveform, not
a single operating point):

| moment | reservoir, volts | blue LED, milliamps |
|---|---|---|
| 0.8 s after power-on | 14.36 | 2.44 |
| lowest point in the first 0.4 s of heavy load | between 7 and 9.5 | — |

```assert
# the oscillator: 1.44 / ((10k + 2 x 22k) x 1 uF)
buzzer_tone_hz: 26.7 +- 0.2
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-charge-pump` prints them one by one.
<!-- engine-provenance -->

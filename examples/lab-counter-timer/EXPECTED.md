# lab-counter-timer — expected behaviour

## Circuit
5 V supply (the counter is a 74HC part).

- **Clock:** 555 astable, 4.7 kΩ + 12 kΩ + 10 µF (control pin 10 nF), about
  five ticks a second. Its reset pin is pulled up by 10 kΩ.
- **Counter:** a 74HC93 4-bit ripple counter. The clock drives input A; output
  QA feeds input B, so QA, QB, QC, QD count in binary. Red LEDs (470 Ω) show
  QA, QB and QC.
- **Stop:** QD lights the green "done" LED and, through 10 kΩ, turns on an NPN
  that pulls the 555's reset pin to ground. The clock stops at the count of 8.
- **Start:** a button that pulls both reset inputs R0 of the counter high
  (10 kΩ pull-down otherwise). That clears the count, QD goes low, the clock
  runs again.

## Expected behaviour
- From power-on the LEDs count 1, 2, 3 … 7 in binary, one step per clock tick.
- At the eighth tick QD goes high: the three red LEDs go dark, the green "done"
  LED lights and the clock stops. The timer has run for 8 clock periods.
- Each output toggles half as often as the one before it: QA every tick, QB
  every second, QC every fourth, QD every eighth — every stage divides by two.
- Pressing start repeats the whole run.

## Measured on the engine
Sampled every 50 ms by `test/lab-circuits-1.test.mjs`. Bits are written QD QC QB QA:

| time, milliseconds | count |
|---|---|
| 50 to 150 | 0000 |
| 200 to 350 | 0001 |
| 1600 onwards | 1000 (stopped) |

```assert
# the clock: 1.44 / ((4.7k + 2 x 12k) x 10 uF)
buzzer_tone_hz: 5.02 +- 0.05
# at 1 ms nothing has been counted yet and the 555 is enabled
net cnt.qd V 0.00 +-0.05
net osc.reset V 5.00 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d19b5e4` and `bw-circuit-ui@6b4d702` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 10** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-counter-timer` prints them one by one.
<!-- engine-provenance -->

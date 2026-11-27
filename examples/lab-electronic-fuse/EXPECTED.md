# lab-electronic-fuse — expected behaviour

## Circuit
- **Load path:** +9 V → 470 Ω → green LED → pass transistor (NPN, base fed
  through 2.2 kΩ) → 4.7 Ω sense resistor → ground. The **short circuit** button
  connects a 22 Ω resistor from +9 V straight to the pass transistor's
  collector, bypassing the LED and its 470 Ω.
- **Sense:** the top of the 4.7 Ω feeds the base of q_s (NPN) through 10 kΩ. A
  100 nF capacitor on that base sets how long an overload must last.
- **Latch:** q_s's collector pulls the base of a PNP (q_p) down through 4.7 kΩ
  (22 kΩ holds it off otherwise). q_p's collector feeds q_s's base back through
  4.7 kΩ — an NPN/PNP pair connected like a thyristor.
- **Cut-off:** q_p's collector also drives q_off through a 22 kΩ / 10 kΩ divider;
  q_off pulls the pass transistor's base to ground. A red LED (2.2 kΩ) on q_p's
  collector shows "tripped".
- **Reset** button: shorts q_s's base to ground.

## Expected behaviour
- Normal load: about 14.7 mA through the green LED, only 0.086 V across the
  sense resistor — far below the 0.6 V that would wake q_s.
- Short circuit button pressed: the load current jumps, the sense voltage
  passes about 0.6 V, q_s and q_p switch each other on, q_off turns the pass
  transistor off. The load is cut within microseconds and the red LED lights.
- Short released: the fuse stays blown. The latch holds itself through its own
  feedback, no load current is needed for that.
- Reset pressed: q_s loses its base drive, the latch collapses, the load comes
  back.
- While tripped the latch itself still draws about eleven milliamps.

## Measured on the engine
| step | green load LED | sense voltage | red trip LED | supply |
|---|---|---|---|---|
| normal | 14.69 mA | 0.086 V | 0.000 mA | 18.39 mA |

The tripped states depend on the order of the button presses, which a single
solve cannot reproduce. They are driven in sequence by
`test/lab-circuits-1.test.mjs` (milliamps and volts):

| step | green load LED, milliamps | sense voltage, volts | red trip LED, milliamps | supply, milliamps |
|---|---|---|---|---|
| short circuit pressed | 0 | 0 | 3.24 | 11.17 |
| short released (still blown) | 0 | 0 | 3.24 | 11.17 |
| reset pressed and released | 14.69 | 0.086 | 0 | 18.39 |

## What this verifies
1. A small resistor turns current into a voltage a transistor can watch.
2. Positive feedback between an NPN and a PNP makes a latch that does not let go.
3. Unlike a melting fuse, this one resets with a button.

```assert
# normal operation as authored: pass transistor on, latch off
net rs.a V 0.086 +-0.01
net qp.collector V 0.00 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **23 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-electronic-fuse` prints them one by one.
<!-- engine-provenance -->

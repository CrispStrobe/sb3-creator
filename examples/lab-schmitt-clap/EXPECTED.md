# lab-schmitt-clap — expected behaviour

## Circuit
An emitter-coupled Schmitt trigger on 9 V:

- q1 and q2 (NPN) share one 470 Ω emitter resistor to ground.
- q1's collector has 2.2 kΩ to +9 V and drives q2's base through a 4.7 kΩ /
  10 kΩ divider (100 nF on q2's base).
- q2's collector lights a yellow LED through 1 kΩ.
- q1's base is biased from the **sensitivity** potentiometer (10 kΩ, wiper at
  0.31) through 10 kΩ.
- **Clap:** a stand-in for a microphone pulse. The button pulls a 10 kΩ pull-up
  node to ground; the step passes through 1 µF and a diode into q1's base. The
  diode lets only the falling edge through.
- **Reset:** a button that feeds q1's base extra current through 4.7 kΩ.

## Expected behaviour
- Quiet (as authored): q1 conducts, q2 is off, the LED is dark.
- Clap: the falling pulse pulls q1's base well below the emitter, q1 turns off,
  q2 turns on, the LED lights.
- After the clap: q1's base returns to the bias voltage, but the emitter is now
  held higher by q2's own current through the shared resistor. The bias sits
  between the two switching thresholds, so q1 stays off and the LED stays on.
- Reset: the extra base current lifts q1 over the upper threshold, it turns on
  and q2 turns off. The LED stays dark after release.
- Bias too high (wiper near 0.4): the LED will not stay on after a clap. Bias
  too low: claps are latched but reset no longer works reliably.

## Measured on the engine
| state | q1 base | shared emitter | LED |
|---|---|---|---|
| quiet | 2.22 V | 1.53 V | 0.000 mA |
| after a clap | 2.79 V | 2.44 V | 4.65 mA |
| after reset | 2.22 V | 1.54 V | 0.000 mA |

The emitter voltage is the hysteresis made visible: the same bias meets a
different threshold depending on which transistor carries the current.

## What this verifies
1. Two thresholds (hysteresis) turn a Schmitt trigger into a memory.
2. A short pulse is enough to change state; it is remembered after it ends.

```assert
# quiet: q1 on, q2 off
net q1.collector V 1.66 +-0.1
net re.a V 1.53 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **22 of this page's 22** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-schmitt-clap` prints them one by one.
<!-- engine-provenance -->

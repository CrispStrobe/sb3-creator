# lab-touch-off — expected behaviour

## Circuit
9 V → 1 kΩ → node N. A yellow LED runs from N to ground, so it is lit as long
as nothing else takes the current. Two NPN transistors in Darlington connection
(q1 drives the base of q2) have their collectors on N and q2's emitter on
ground. The touch button stands for two plates; behind it a 2.2 MΩ "finger"
and a 47 kΩ guard resistor lead to q1's base.

## Expected behaviour
- Not touched: the pair is off, the whole 7.0 mA through the 1 kΩ goes through
  the LED, which is lit.
- Touch button pressed: the pair saturates and pulls N down to about 0.77 V.
  That is far below the LED's forward voltage, so the LED goes dark; the
  current now flows through the transistors instead (about 8.2 mA, a little
  more than before, because nothing holds N up any more).
- This is a shunt: the transistor does not break the LED's circuit, it offers
  the current an easier path.

## Measured on the engine
| state | node N | LED current | 1 kΩ current |
|---|---|---|---|
| not touched | 1.97 V | 7.03 mA | 7.03 mA |
| touch button pressed | 0.774 V | 0.000 mA | 8.23 mA |

## What this verifies
1. An inverting touch switch needs no extra stage: shunting the load is enough.
2. The supply current does not drop when the lamp goes out — shunt switching costs power.

```assert
# untouched: the LED holds node N at its forward voltage
net led1.anode V 1.97 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0bc7baf` and `bw-circuit-ui@8404334` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 15** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-touch-off` prints them one by one.
<!-- engine-provenance -->

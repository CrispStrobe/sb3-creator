# lab-opamp-follower — expected behaviour

## Circuit
Two identical potato cells. Each is drawn as what it is electrically: a 0.9 V source with a 5 kΩ resistor in series, standing for the resistance inside the potato. Both have to drive the same kind of load, a 4.7 kΩ resistor (think of a cheap meter or a small motor driver input).

- **Potato A** drives its 4.7 kΩ load directly.
- **Potato B** feeds the non-inverting input of an LM358 wired as a voltage follower (output tied to the inverting input). The follower drives the second 4.7 kΩ load.

The LM358 runs from 9 V. Voltmeters read both loads. The second half of the LM358 is parked as a follower at ground.

## Observable behaviour
- **Direct:** potato A's voltage collapses to about 0.436 V under the load. The 5 kΩ inside the potato and the 4.7 kΩ load form a divider: 0.9 × 4.7 / 9.7 = 0.436 V.
- **Through the follower:** the load on potato B reads 0.900 V, the full cell voltage. The op-amp's input draws essentially nothing, so no voltage is lost inside the potato.
- **Who pays:** the second load still takes 0.19 mA, but that current comes from the op-amp's 9 V supply, not from the potato.

## What this verifies
1. A weak source sags under a low-resistance load (source resistance and load form a divider).
2. A voltage follower has gain 1, very high input resistance and low output resistance: it copies a voltage without loading it.

```assert
net r_in_a.b V 0.436 +-0.005
net r_in_b.b V 0.900 +-0.005
net u1.1_out V 0.900 +-0.005
```

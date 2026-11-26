# lab-flame-ir-latch — expected behaviour

## Circuit
- 9 V supply. A phototransistor (light slider, dark as built) from +9 V into the base of an NPN: a Darlington. The NPN's collector lights a yellow LED through 1 kΩ from +9 V; its emitter has 220 Ω to ground, and that node is the LM386's + input.
- The LM386's − input sits at 0.62 V (680 kΩ from +9 V against the amplifier's own input resistance). Its output feeds 470 Ω, a red LED and an infrared LED in series to ground.
- A light path (air, 4 cm) carries the infrared LED's light to the phototransistor; its knob is a hand in the beam (0 clear, 1 blocked).

## Observable behaviour
- Dark: output 0.9 V, all LEDs dark.
- A glimmer (light 0.001, then 0.003): the yellow LED takes 0.5 mA at the first, three times as much at three times the light — the light amplifier — but the output stays low.
- Flame (light 0.02): the output jumps to 8.1 V and the red + infrared LEDs take 10.9 mA.
- Flame gone (light 0): it stays on, held by its own infrared; the Darlington stays saturated.
- Hand in the beam: off. Hand away: stays off.

## Measured on the engine
bw-board d4113b4b, `test/lab-circuits-r6h.test.mjs`: dark 0.900 V; 0.001 → 0.500 mA, 0.003 → 1.500 mA (output 0.900 V); flame 8.097 V, 10.926 mA, + input 1.369 V; flame gone 8.097 V, 5.681 mA; blocked and after 0.900 V, 0 mA.

## What this verifies
1. A Darlington multiplies the phototransistor's current (5 µA at light 0.001 becomes 0.5 mA).
2. Optical positive feedback makes a latch: the output's own light keeps its input above the threshold.
3. Interrupting the loop resets it, and it stays reset without a new trigger.

## Simulation notes
The flame is the phototransistor's light slider (its own light adds to the light path's). The LM386 is used open-loop as a comparator with its gain of 20, so the + input must pass the − input by about 0.2 V for a full swing; the optical loop provides far more.

```assert
# 1 ms after switch-on (the solve assert-physics runs): dark, off
net lm386_8.inn V 0.616 +-0.01
net lm386_8.vout V 0.900 +-0.02
net npn_4.collector V 8.06 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **24 of this page's 27** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-flame-ir-latch` prints them one by one.
<!-- engine-provenance -->

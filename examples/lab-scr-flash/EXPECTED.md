# lab-scr-flash — expected behaviour

## Circuit
- 9 V through a main slide switch (position 1 = on) into the "flash lamp": 470 Ω and a white LED, to the anode, the emitter of a PNP. The PNP and an NPN form a thyristor as in lab-scr-pair: each collector feeds the other's base, 4.7 kΩ from the PNP's base to its emitter, 1 kΩ and 10 nF from the NPN's base (the gate) to the cathode (ground). 47 kΩ from the anode to the cathode keeps the anode at a defined voltage while it is off.
- A phototransistor from +9 V with 1 kΩ in its emitter watches the room (its light slider). Its emitter reaches the gate only through 100 nF, then a diode (10 kΩ to ground before it) and 1 kΩ.

## Observable behaviour
- Off: the anode sits at about 6.3 V and the lamp is dark.
- Room light changing slowly, even in many small steps up to 0.6 of full light: the emitter follows (3 V at 0.6), the capacitor passes almost nothing, and the thyristor stays off.
- A flash, a sudden jump of the light by about 0.7 of full or more (from darkness to full light, or from 0.2 to full): the emitter jumps by several volts, the capacitor passes the step as a gate pulse, and the thyristor fires. The lamp carries about 11 mA and stays on after the flash is over.
- A smaller jump, from 0.6 of full light to nothing or from 0.5 to full, does not fire it.
- Main switch off and on again: off until the next flash.

## Measured on the engine
Slow ramp to 0.6 in steps of 0.02 every 20 ms: emitter 3.00 V, anode 6.27 V. Light 0 → 0.6 → 0: off; 0 → 1 → 0: fired, the anode collapses to under a volt; 0.2 → 1 → 0.2: fired; 0.5 → 1 → 0.5: off. Fired, the lamp carries about eleven milliamps. Reset: anode 6.27 V. `test/lab-circuits-r6d.test.mjs` holds these.

## Simulation notes
The 10 nF from gate to cathode is ordinary practice against false triggering. It also matters to the simulator: after every change of a control the engine solves the circuit once without the transistors' stored charge, and without that capacitor holding the gate a latch that is off could land in its on state there (found while building this bench; reported with a minimal case).

## What this verifies
1. A capacitor makes a trigger respond to how fast the light changes, not how bright it is.
2. A thyristor, once fired, holds the load on until its current is broken.

```assert
# t = 1 ms: dark room, thyristor off
net vsource_2.pos V 9.00 +-0.01
net pnp_6.emitter V 6.27 +-0.05
net npn_7.base V 0.00 +-0.02
net phototransistor_10.emitter V 0.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **16 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-scr-flash` prints them one by one.
<!-- engine-provenance -->

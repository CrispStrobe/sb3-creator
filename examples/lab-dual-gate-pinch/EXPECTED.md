# lab-dual-gate-pinch — expected behaviour

## Circuit
- 9 V supply. A depletion-mode dual-gate MOSFET (`dual_gate_mosfet_5`, the part's default card). Drain to the supply through a red LED and 1 kΩ (`resistor_3`).
- The source is lifted by a stiff divider, 470 Ω from the supply and 220 Ω to ground (a little over three volts with the drain current).
- Gate 1 and gate 2 each have a 10 kΩ pot across the supply (`potentiometer_8`, `potentiometer_9`), both at 0.36 (the source's level) as authored.

## Observable behaviour
- Both gates at the source's level: the LED carries about 3.1 mA.
- Gate 2 turned down step by step (gate 1 left where it is): the LED dims smoothly, with a last glimmer just above pinch-off, and is dark once gate 2 is more than the pinch-off voltage below the source.
- Gate 1 turned down instead: dark as well, even with gate 2 turned fully up. Either gate alone pinches the channel off.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs`; the device state's `pinchedBy` names the gate.

## What this verifies
1. The two gates sit over one channel in series: either can cut it.
2. Between the source's level and pinch-off a gate controls the current continuously.

## Simulation notes
The device is two level-1 n-channel halves in series on an internal node (the default card: pinch-off at minus 1.2 volts per half, no body effect).

```assert
# power-on: source lifted, gates at its level, the channel conducting
net vsource_2.pos V 9.00 +-0.01
net dual_gate_mosfet_5.source V 3.33 +-0.05
net dual_gate_mosfet_5.gate1 V 3.24 +-0.02
net dual_gate_mosfet_5.drain V 4.29 +-0.05
```


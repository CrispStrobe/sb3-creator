# lab-scr-pair — expected behaviour

## Circuit
9 V through a main slide switch (position 1 = on) into the load: 1 kΩ plus a red LED, to the "anode", the emitter of a PNP transistor. The PNP's collector drives the base of an
NPN; the NPN's collector drives the PNP's base. 22 kΩ from the PNP's base to its emitter, 10 kΩ from the NPN's
base to its emitter (the "cathode", ground). The gate button feeds the NPN's base from +9 V through 10 kΩ.

## Observable behaviour
- Power on: both transistors are off, the anode sits at the full 9 V and the LED is dark.
- Press the gate button, even for a millisecond: both transistors switch on and hold each other on. The anode
  drops to about 0.76 V and the LED carries about 6.5 mA.
- Release the gate: nothing changes. The pair keeps itself on.
- Press the gate again: nothing changes either.
- Only breaking the main current resets it: slide the main switch off and back on, and the LED stays dark
  until the next gate pulse.

## What this verifies
1. Two transistors in a loop make a four-layer latch: the behaviour of a thyristor.
2. The gate can only switch it on; to switch it off the load current has to stop.

```assert
# t = 1 ms: not yet triggered
net vsource_2.pos V 9.00 +-0.01
net pnp_6.emitter V 9.00 +-0.01
net npn_7.base V 0.00 +-0.01
```

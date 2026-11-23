# lab-pnp-npn-relax — expected behaviour

## Circuit
9 V. A 4.7 µF electrolytic charges through 22 kΩ plus a 220 kΩ rheostat, authored at the middle of its
travel. The capacitor's + side is the emitter of a PNP transistor whose base sits on a 1 kΩ / 2.2 kΩ
divider (6.19 V). The PNP's collector feeds the NPN's base (100 kΩ from base to emitter); the NPN's collector
pulls the PNP's base down. The NPN's emitter goes to ground through a red LED with 47 Ω, and through 1 kΩ.

## Observable behaviour
- With the rheostat in the middle (110 kΩ, so 132 kΩ in total) the capacitor charges slowly. Nothing happens until it passes the PNP's base by one junction drop, at about
  6.86 V.
- Then the pair fires: the PNP feeds the NPN, the NPN pulls the PNP's base down, and both slam on. The
  capacitor dumps through the LED in a short, bright flash, far more current than the charging
  resistors could ever supply.
- Once the capacitor is down to about 2.7 V the current is too small to hold the pair on, it lets go, and the
  charging starts again: a sawtooth on the capacitor, a flash at every reset.
- With the rheostat in the middle there is a flash about every 0.67 s. At its minimum (22 kΩ left) the flashes
  come every 0.11 s or so; at its maximum about every 1.2 s.
- Low-battery indicator: the trigger point follows the battery voltage. Below about 5 V the charging current
  near the trigger point is too small to fire the pair, the capacitor settles below it and the flashing stops.
  At 5.5 V it still flashes.

## What this verifies
1. A PNP-NPN pair with a divider on its gate behaves like a programmable unijunction transistor: off until a
  set voltage, then a sudden discharge.
2. Relaxation oscillation: slow charge, fast dump, repeat.

```assert
# t = 1 ms: capacitor still empty, trigger divider at 2.2/3.2 of the supply
net vsource_2.pos V 9.00 +-0.01
net pnp_6.base V 6.19 +-0.02
net polarized_cap_5.pos V 0.01 +-0.02
```

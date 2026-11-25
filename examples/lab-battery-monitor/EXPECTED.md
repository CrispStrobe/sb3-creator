# lab-battery-monitor — expected behaviour

## Circuit
An adjustable supply, 9 V as authored. A 2.2 µF electrolytic charges through 100 kΩ. Its + side is the
emitter of a PNP transistor. The PNP's base sits on a trigger divider: 1 kΩ from the supply, a 2.2 kΩ
"set" potentiometer whose wiper is the base, and 6.8 kΩ to ground, so the base sits at 68 % to 90 % of
the supply depending on the knob (79 % at mid-travel). The PNP's collector feeds an NPN's base (100 kΩ
from base to emitter); the NPN's collector pulls the PNP's base down. The NPN's emitter goes to ground
through a red LED with 47 Ω, and through 1 kΩ.

## Observable behaviour
- As authored (set knob in the middle, 9 V): the PNP's base sits at 7.11 V. The capacitor charges until it
  is one junction drop above that, then the pair fires and dumps the capacitor through the LED: a flash
  about every 0.37 s.
- The pair can only fire if the charging resistor still delivers enough current when the capacitor
  reaches the trigger point. That current comes from the gap between the supply and the trigger point,
  and that gap is a fixed fraction of the supply. A lower supply leaves too small a gap: the capacitor
  creeps up to just below the trigger point and stays there. The LED stays dark.
- With the knob in the middle the flashing stops between 6.25 V and 6.5 V: at 6.5 V it still flashes, at
  6.25 V it does not. The flash rate hardly changes on the way down: it simply stops. This is a
  battery monitor: flashing means the battery is still above the set voltage.
- The set knob moves that voltage. Knob at 0.2 (base at 72 % of the supply): it still flashes at five
  volts and only stops at four and three-quarter volts. Knob at 0.8 (86 %): even nine volts is not
  enough; it needs nine and a half.

## What this verifies
1. A PNP-NPN trigger pair only relaxes when the charging current at the trigger point is large enough.
2. Because the trigger point is a fraction of the supply, that condition is a minimum supply voltage,
   and the divider ratio sets it.

```assert
# t = 1 ms: capacitor just starting (9 V x 1 ms / 0.22 s), divider at 7.11 V
net pnp_5.base V 7.110 +-0.02
net resistor_7.b V 8.100 +-0.02
net polarized_cap_4.pos V 0.041 +-0.01
```

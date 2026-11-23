# lab-fibre-gap-gauge — expected behaviour

## Circuit
- 9 V battery. A red LED with 470 Ω lights a light guide made of two pieces that meet in a joint. The gap between the two fibre ends is the light path's knob, 0 to 0.5 mm; authored 0.10 mm.
- The far end lights a phototransistor (iMax 0.5 mA) whose emitter current flows through 47 kΩ to ground and sets the base of an NPN transistor. The NPN drives a PNP (1 kΩ into its base, 10 kΩ base to +9 V); the PNP's collector feeds the NPN's emitter and the 1 kΩ load. This complementary pair acts as one very high-gain emitter follower. The voltmeter reads the load.

## Observable behaviour
- 0.10 mm gap: about 6.36 V.
- Joint closed (0 mm): about 7.93 V; 0.05 mm already takes off more than half a volt.
- 0.5 mm: about 2.83 V.

## What this verifies
1. Light leaving one fibre spreads out; the second fibre catches less of it the wider the gap.
2. A complementary NPN/PNP pair follows a high-impedance source without loading it, so a tiny photocurrent drives a meter.

```assert
# The meter at the authored 0.10 mm joint gap.
net voltmeter_12.a V 6.36 +-0.1
```

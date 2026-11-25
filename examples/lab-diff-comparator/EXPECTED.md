# lab-diff-comparator — expected behaviour

## Circuit
9 V. Two NPN transistors share one 4.7 kΩ emitter resistor (the tail); each collector has 4.7 kΩ to
+9 V. The reference base (q1) sits on a 10 kΩ / 10 kΩ divider. The input base (q2) is the wiper of a
1 kΩ "fine" potentiometer that hangs between two 4.7 kΩ limiting resistors, so its whole travel only
covers about 4.07 V to 4.91 V. A voltmeter reads input minus reference directly.

The two collectors drive an LM386 audio power amplifier, the engine's stand-in for a TBA820-class
amplifier chip: q1's collector through 1 MΩ to the + input, q2's through 1 MΩ to the
− input. Together with the chip's own input resistors to ground these keep both inputs near a third of a
volt, inside the small range an audio amp's inputs accept. The gain pins are joined, so the chip
amplifies the input difference 200 times down to DC; its output rests at half the supply. The output
lights a green LED (1 kΩ to ground) when high and a red LED (1 kΩ from +9 V) when low.

## Observable behaviour
- Input above the reference: q2 takes more of the tail current, its collector falls below q1's, and the
  amplifier's output swings to its top limit (about 8.1 V): green.
- Input below the reference: the collectors swap places and the output drops to its bottom limit (about
  0.9 V): red.
- The whole changeover lies within about half a millivolt between the two bases; in between, the output
  passes through half supply and both LEDs glow. The bare pair needs roughly a tenth of a volt to move
  its current from one side to the other; here the amplifier multiplies the collector difference until
  the output is at one end or the other.
- Fine tuning: the limiting resistors shrink the knob's range to under a volt, so one percent of travel is
  about 6 mV instead of about 90 mV for a knob across the whole supply. The switching point sits near
  the middle of the travel, between 0.485 and 0.495.
- As authored (knob at 0.5): input 4.4865 V, reference 4.4859 V, a difference of about 0.6 mV, and the
  output is high.

## What this verifies
1. A differential pair followed by a high-gain amplifier is a comparator far more sensitive than the
   pair alone.
2. Series resistors on a potentiometer trade range for resolution.

```assert
# knob at 0.5: input 0.6 mV above the reference, output at its top limit
net npn_10.base V 4.4865 +-0.005
net npn_9.base V 4.4859 +-0.005
net resistor_13.a V 3.809 +-0.03
net lm386_16.inp V 0.364 +-0.01
net lm386_16.vout V 8.10 +-0.1
```

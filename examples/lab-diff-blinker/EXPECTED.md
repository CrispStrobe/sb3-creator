# lab-diff-blinker — expected behaviour

## Circuit
9 V. A differential pair: two NPN transistors, each with its own 1.2 kΩ emitter resistor into a shared
4.7 kΩ tail to ground, and 10 kΩ from each collector to +9 V. q2's base is the set point, a 10 kΩ /
10 kΩ divider at half supply. The collectors drive an LM386 audio power amplifier, the engine's stand-in
for the TBA820-class amplifier chip such a kit would use: q1's collector through 680 kΩ to the + input,
q2's through 680 kΩ to the − input, which keeps the chip's inputs within a few tenths of a volt of
ground. The gain pins are joined (gain 200 down to DC); the output rests at half supply and lights a
green LED through 1 kΩ.

The output also comes back to q1's base, through a delay line of three 10 kΩ resistors with a 10 µF
electrolytic to ground after each one. A slide switch can connect a 3.3 µF capacitor from the
amplifier's output to its − input (the Miller capacitor); as authored it is switched out.

## Observable behaviour
- At switch-on the delay line is empty, q1's base is low, q2 takes all of the tail current and the output
  sits at its top limit (about 8.1 V): green.
- The feedback is negative — a high output raises q1's base until it passes the set point and the output
  falls — but it arrives late. By the time the delay line reports "too high", the output has long been
  high, so it overshoots, swings low, and the same happens in reverse. The output swings between its
  limits (about 0.9 V and 8.1 V) and the LED blinks about every quarter of a second.
- Slide the switch to connect the Miller capacitor. Now the amplifier can only change its output slowly,
  in proportion to the pair's current difference, so it no longer outruns the delay line. The output
  creeps towards the balance point, overshoots once and settles within about three seconds: about 4.47 V,
  the delayed base equal to the set point, and the LED glowing steadily at part brightness.
- Switch the capacitor out again and the blinking returns.
- The emitter resistors matter: they let the pair hand on differences of up to about a volt instead of a
  few tens of millivolts, so the slowed amplifier can still move its output at a useful speed.

## What this verifies
1. A high-gain amplifier with delayed negative feedback oscillates.
2. A capacitor from an amplifier's output back to its inverting input (Miller compensation) slows it
   enough to make the same loop stable.

```assert
# t = 1 ms: delay line nearly empty, q2 saturated with the whole tail current, output at its top limit
net npn_6.collector V 3.583 +-0.1
net lm386_14.inp V 0.608 +-0.02
net lm386_14.vout V 8.10 +-0.1
net polarized_cap_18.pos V 0.080 +-0.01
```

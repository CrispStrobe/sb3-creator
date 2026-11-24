# lab-diff-blinker — expected behaviour

## Circuit
9 V. A differential pair: two NPN transistors, each with its own 47 kΩ emitter resistor into a shared
4.7 kΩ tail to ground, and 47 kΩ from each collector to +9 V. q2's base is the set point, a 10 kΩ /
10 kΩ divider at half supply. The collectors drive one half of an LM358: q1's to the + input, q2's to the
− input, so the output goes high when q1's base is below the set point. The output lights a green LED
through 1 kΩ.

The output also comes back to q1's base, through a delay line of three 10 kΩ resistors with a 10 µF
electrolytic to ground after each one. A slide switch can connect a 4.7 µF capacitor from the op-amp's
output to its − input (the Miller capacitor); as authored it is switched out.

## Observable behaviour
- At switch-on the delay line is empty, q1's base is low, q2 takes all of the tail current (about
  74 µA) and the output is high: green.
- The feedback is negative — a high output raises q1's base until it passes the set point and the output
  falls — but it arrives late. By the time the delay line reports "too high", the output has long been
  high, so it overshoots, swings low, and the same happens in reverse. The output swings between its
  rails and the LED blinks about every 0.28 s.
- Slide the switch to connect the Miller capacitor. Now the op-amp can only change its output slowly,
  in proportion to the pair's current difference, so it no longer outruns the delay line. Within a
  couple of seconds the swings die out: the output settles near 4.4 V, the delayed base sits within a
  tenth of a volt of the set point and the LED glows steadily at about half brightness (about 2.55 mA).
  A capacitor of a fifth of that size is not enough: the loop keeps swinging.
- Switch the capacitor out again and the blinking returns.

## What this verifies
1. A high-gain amplifier with delayed negative feedback oscillates.
2. A small capacitor across the second gain stage (Miller compensation, the trick inside every op-amp
   chip) slows that stage enough to make the same loop stable.

```assert
# t = 1 ms: delay line nearly empty, q2 carries the tail current, output high
net npn_6.base V 4.496 +-0.02
net npn_6.collector V 5.561 +-0.1
net lm358_12.1_out V 7.20 +-0.1
net polarized_cap_16.pos V 0.071 +-0.01
```

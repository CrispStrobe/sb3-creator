# lab-astable-blinker — expected behaviour

## Circuit
Two NPN transistors on 9 V. Each collector lights an LED through 470 Ω (Q1 red, Q2 green). A 10 µF
electrolytic runs from each collector (+) to the other transistor's base. Q2's base is pulled up through
68 kΩ; Q1's base through 10 kΩ plus a 100 kΩ rheostat, authored a little below the middle of its travel.

## Observable behaviour
- With the rheostat as authored (58 kΩ, so 68 kΩ in total on each side) the two LEDs take turns, about 1.3
  times a second: one full red-green cycle lasts about 0.75 s, and each colour is on for about half of it
  (red a little longer, about 55 %).
- A lit LED carries about 13.5 mA; the dark one carries nothing.
- Turn the rheostat to its minimum (only the 10 kΩ left): the green half (the time Q1 is held off) gets short and the cycle drops
  to about 0.49 s. Turn it to its maximum (110 kΩ): the cycle stretches to about 0.87 s.
- Watch a base on the scope: when the other transistor switches on, the base is kicked about 6 V below
  ground and then climbs back through its resistor until it reaches about 0.7 V — that climb is the timing.

## Why the halves are shorter than the textbook 0.69 · R · C
68 kΩ gives the conducting transistor only about 0.12 mA of base current, which is not quite enough to keep
it saturated with a 13.5 mA LED load. Its collector settles at about 1.5 V instead of near zero, so the kick
on the other base is smaller than the full supply and the base needs less time to climb back: about 0.37 s
per half here instead of the 0.47 s the formula gives.

## What this verifies
1. Two RC timers that switch each other: positive feedback plus delay makes an oscillator.
2. Each half-period is set by its own resistor and capacitor.

```assert
# t = 1 ms: Q1 has won the start-up race and conducts, Q2's base is still held down
net vsource_2.pos V 9.00 +-0.01
net npn_3.collector V 0.03 +-0.03
net npn_3.base V 0.81 +-0.05
net npn_4.base V 0.05 +-0.05
```

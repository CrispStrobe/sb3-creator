# lab-toggle-flip-flop — expected behaviour

## Circuit
A two-transistor flip-flop on 9 V: each collector has 1 kΩ plus an LED to +9 V (Q1 red, Q2 green); Q1's
collector feeds Q2's base through 22 kΩ, Q2's collector feeds Q1's base through 27 kΩ. A 4.7 µF steering
electrolytic follows Q1's collector through 470 kΩ. Two push buttons in parallel each connect that capacitor
to Q1's base.

## Observable behaviour
- Power on: green is lit (about 6.8 mA), red is dark. The weaker 27 kΩ feed into Q1 decides this.
- While Q1 is off its collector is high, so the capacitor charges to several volts.
- Press a button: the charged capacitor pushes current into Q1's base, Q1 switches on, red lights (about
  7.1 mA) and green goes dark. It stays that way after you let go.
- While Q1 is on its collector is low, so the capacitor drains to about 0.25 V.
- Press again: the nearly empty capacitor pulls Q1's base down, Q1 switches off and green comes back.
- Either button does the same thing: two switches for one light, as on a staircase.
- Switch off and press again within about 0.1 s: nothing happens, because the capacitor has not recharged
  yet. A built-in minimum interval between two presses, a crude debounce. After about 0.2 s it works again.
- Holding a button down flips once and then stays: 470 kΩ is too weak against the 27 kΩ feed to flip it
  back.
- The dark LED is not quite off: about 0.3 mA still flows through it into the other base's resistor.

## What this verifies
1. A flip-flop plus a capacitor that remembers "the opposite of now" divides presses by two: a T flip-flop.
2. The capacitor needs time to recharge, so presses that come too fast are lost.

```assert
# power-on state at t = 1 ms: Q2 conducts (green), Q1 off
net vsource_2.pos V 9.00 +-0.01
net npn_4.collector V 0.09 +-0.05
net npn_3.collector V 7.18 +-0.10
net npn_4.base V 0.69 +-0.05
```

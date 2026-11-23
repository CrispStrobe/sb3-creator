# lab-transistor-flip-flop — expected behaviour

## Circuit
Two NPN transistors on 9 V. Each collector has 1 kΩ plus an LED to +9 V (Q1 red, Q2 green).
Q1's collector feeds Q2's base through 22 kΩ; Q2's collector feeds Q1's base through 27 kΩ.
SET shorts Q2's base to ground, RESET shorts Q1's base.

## Observable behaviour
- Power on: Q2 conducts and the green LED is lit (about 7 mA); Q1 is off and its collector sits near 7.1 V.
  The slightly weaker 27 kΩ feed into Q1 decides this race every time.
- Press SET: Q2 loses its base current, its collector rises, that rise turns Q1 on, and Q1 holds Q2 off.
  Red lights, green goes dark, and it stays like that after you let go.
- Press SET again: nothing changes — the bit is already set.
- Press RESET: the mirror image, green again.
- Press both: both bases are grounded and both LEDs go dark; whichever button you release last loses.
- The dark LED is not quite off: about 0.3 mA still flows through it into the other transistor's base resistor.

## What this verifies
1. Positive feedback gives two stable states — one bit of memory.
2. A short pulse on one input is enough; the circuit remembers it.

```assert
# power-on state: Q2 saturated (green), Q1 off (red dark)
net vsource_2.pos V 9.00 +-0.01
net npn_4.collector V 0.09 +-0.05
net npn_3.collector V 7.10 +-0.10
net npn_3.base V 0.09 +-0.05
```

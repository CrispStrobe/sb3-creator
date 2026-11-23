# lab-shunt-gates — expected behaviour

## Circuit
Three lamp channels on a 9 V supply, each 1 kΩ → LED → ground. The
buttons never sit in series with a lamp; they sit across it and, when they
close, give the current a path around the LED:

- **NOT** (red): one button A across the LED.
- **NAND** (yellow): buttons A and B in series, the pair across the LED.
- **NOR** (green): buttons A and B in parallel across the LED.

The 1 kΩ stays in every channel, so a closed button never shorts the battery.

## Expected behaviour
Output 1 = LED lit. A lit LED carries about 7 mA: 7.23 mA for red, 7.03 mA for
yellow, 6.93 mA for green, whose forward voltage is highest.

| A | B | NOT A | A NAND B | A NOR B | supply (mA) |
|---|---|---|---|---|---|
| 0 | 0 | 1 | 1 | 1 | 21.19 |
| 1 | 0 | 0 | 1 | 0 | 25.03 |
| 0 | 1 | 1 | 1 | 0 | 23.26 |
| 1 | 1 | 0 | 0 | 0 | 27.00 |

Note the last column: the supply current RISES as lamps go dark. A dark
channel still passes 9 V / 1 kΩ = 9 mA through its closed button, more than the
roughly 7 mA a lit LED lets through, because the LED's forward voltage is no longer in
the way. Shunt logic spends the most power when it says "0".

## What this verifies
1. Series contacts make AND, parallel contacts make OR; shorting the lamp inverts them.
2. NAND and NOR need nothing but two buttons and a lamp.
3. A dark output is not an idle output.

```assert
# all buttons open: every gate outputs 1, each LED at its own colour's forward voltage
net led1.anode V 1.77 +-0.05
net led2.anode V 1.97 +-0.05
net led3.anode V 2.07 +-0.05
```

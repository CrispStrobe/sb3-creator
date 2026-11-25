# lab-opamp-gates — expected behaviour

## Circuit
- 9 V supply. Buttons A (button_4) and B (button_7) each lift a line to 6.13 V (22 kΩ from +9 V against 47 kΩ to ground).
- LM324 sections 1 and 2 buffer the two lines (followers); two 10 kΩ average the buffered lines: 0 V, 3.07 V or 6.13 V.
- A 10 kΩ / 6.8 kΩ / 3.3 kΩ chain gives 4.5 V and 1.5 V; MODE (slide_switch_15) picks 4.5 V (left) or 1.5 V (right) as the reference.
- Section 3: average on +, reference on −; green LED (led_17). Section 4: the other way round; red LED (led_19).

## Observable behaviour
- MODE left: green lights only with A and B both pressed (AND), red in every other case (NAND).
- MODE right: green lights with A or B or both (OR), red only with neither (NOR).

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: outputs 7.22–7.24 V (high) and 0.005 V (low) in all eight combinations; average 3.075 V (one button) and 6.13 V (both).

## What this verifies
1. A comparator against a reference between "one input" and "two inputs" is an AND; a reference between "none" and "one" is an OR.
2. Swapping a comparator's inputs inverts its answer: NAND and NOR.
3. The followers keep the averaging resistors from loading the button lines.

## Simulation notes
The lines stay at 6.13 V, inside the LM324's input range (up to 7.5 V on a 9 V supply).

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net slide_switch_15.com V 4.522 +-0.01
net resistor_13.b V 1.478 +-0.01
net lm324_3.3_out V 0.005 +-0.01
net lm324_3.4_out V 7.222 +-0.03
```

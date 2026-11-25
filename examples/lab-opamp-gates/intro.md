# Logic gates from op-amps

Four op-amps, two buttons, two LEDs: AND, NAND, OR and NOR, all from comparators.

**Teaches:** logic gates, comparators, buffering

## What to do

Click **Sim**. With MODE (slide_switch_15) on the left, try all four combinations of A (button_4) and B (button_7), and watch the green and red LEDs. Then slide MODE to the right and try them again.

## What you should see

- MODE left: green only when both buttons are held (AND); red otherwise (NAND).
- MODE right: green when at least one button is held (OR); red only when none is (NOR).

## Why it works

Two followers copy the button lines and two resistors average them, so the average says how many buttons are held. One comparator asks "is the average above the reference?", the other asks the opposite question. A high reference needs both buttons, a low one needs only one.

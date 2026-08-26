# AND, OR and XOR side by side

The same two switches drive an AND (74HC08), an OR (74HC32) and an XOR (74HC86) at once, each with its own LED. Walk the four input combinations and read three truth tables side by side. XOR is the odd one out — it means "exactly one of you" — and that is the gate that adds.

**Teaches:** comparing three truth tables on one pair of inputs

## What to do

Set the DIP switches and watch the outputs. The build needs 2 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| A | B | AND | OR | XOR |
|---|---|---|---|---|
| 0 | 0 | off | off | off |
| 1 | 0 | off | ON | ON |
| 0 | 1 | off | ON | ON |
| 1 | 1 | ON | ON | off |

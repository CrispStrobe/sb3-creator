# Trip-wire alarm that stays on

A thin wire across a doorway. Break it and the alarm sounds – and it keeps sounding even if the wire is joined again. Only the hidden reset button stops it.

**Teaches:** latch, memory, 555 trigger and reset

## What to do

Click **Sim**. Open WIRE (switch_5): the wire breaks. Close it again. Then press RESET (button_8). Try RESET once more while WIRE is open.

## What you should see

- Wire broken: the red LED lights and the piezo sounds (about 680 Hz).
- Wire joined again: it keeps sounding.
- RESET: silence – unless the wire is still broken, then the alarm comes back as soon as you let go.

## Why it works

Inside the 555 is a flip-flop. The wire keeps its trigger input high; breaking it lets the input fall, which sets the flip-flop: the output goes high and switches on the second 555, the tone. Its threshold input, which would normally switch it off again, is tied to ground, so only the reset input can clear it.

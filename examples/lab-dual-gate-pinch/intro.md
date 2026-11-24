# Two gates, one channel: either one can close it

A dual-gate MOSFET has two gates one behind the other over the same channel. Each gate has its own pot here. Turn either one low enough and the LED goes out, no matter what the other gate does. Between the two, a gate dims the LED smoothly.

**Teaches:** dual-gate MOSFETs, pinch-off, a gate as a continuous control

## What to do

Click **Sim**. Both pots start at the source's level and the LED is lit. Turn the gate 2 pot down slowly and watch the LED dim and go out. Turn it back up. Now turn the gate 1 pot down instead, and try turning gate 2 fully up while gate 1 is down.

## What you should see

- Both gates at the source's level: the LED lit, about 3 mA.
- Gate 2 going down: the LED dims smoothly and goes dark about 1.2 V below the source.
- Gate 1 down: dark, even with gate 2 turned fully up.

## Why it works

The two gates sit over two halves of one channel, one after the other, like two taps in one pipe. Closing either tap stops the flow. The source is lifted to about 3.3 V by the two resistors, so the pots can take each gate below it: this depletion MOSFET is fully on with its gates at the source's level and only pinches off with them about 1.2 V lower.

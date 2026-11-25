# Level-crossing lights from one op-amp

At a level crossing two red lamps flash in turn while a train approaches. Here one op-amp does it: it switches itself back and forth, and its output lights one lamp while it is high and the other while it is low.

**Teaches:** op-amp astable, hysteresis, driving two LEDs in opposite phase

## What to do

Click **Sim**. Watch the two red LEDs. Open the **TRAIN** switch, then close it again.

## What you should see

- TRAIN closed: the two lamps flash in turn, about one and a half times a second.
- TRAIN open: both lamps go dark.

## Why it works

Three equal resistors at the + input make the op-amp a comparator with two thresholds that depend on its own output. The 10 µF capacitor on the − input charges through 47 kΩ towards the output; when it reaches the threshold the output flips, the threshold jumps, and the capacitor heads the other way. One lamp hangs from the output to ground, the other from the supply to the output, so they can never be lit together.

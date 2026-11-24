# A pulse across a transformer sets a flip-flop

A charged capacitor, dumped into one winding of a transformer, makes a pulse in the other winding. That winding has no wire to the battery side, yet its pulse sets a transistor flip-flop, which then remembers it. Ignition systems trigger this way, with the two sides kept apart.

**Teaches:** pulse transfer through a transformer, galvanic isolation, a flip-flop as memory

## What to do

Click **Sim**. Green is on. Press the left push button (it dumps the capacitor into the small winding) and let go. Then press the right push button (reset).

## What you should see

- At rest: green on, red off.
- One press of the pulse button: a pulse of about 5 V in the large winding, and the LEDs swap: red on. They stay so.
- Reset: green again. The capacitor has recharged by then, ready for the next pulse.

## Why it works

The capacitor's sudden current in the small winding builds a magnetic field in the core, and the field's change induces a voltage in the large winding. The diode passes the positive pulse into the left transistor's base: it switches on, which switches the right transistor off, which keeps the left one on through its 22 kΩ. The reset button shorts the left base to ground and the flip-flop falls back.

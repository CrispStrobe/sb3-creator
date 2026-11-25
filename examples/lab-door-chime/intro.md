# Shop-door chime

Open the door and a chime sounds for a moment, then stops by itself. Two transistors time it, a third switches the tone generator on and off.

**Teaches:** monoflop, fixed pulse length, gating a tone generator

## What to do

Click **Sim**. Press the DOOR button (button_12) briefly and listen. Press it again, a little longer this time.

## What you should see

- Each press starts a tone of about 280 Hz that lasts about a third of a second.
- A tap and a slightly longer press give the same length of chime.

## Why it works

At rest one transistor of the pair is on and the other off, and the off one's high collector keeps a third transistor switched on, which holds the tone generator silent. A press flips the pair; the capacitor between them keeps it flipped until it has recharged, which always takes the same time. While the pair is flipped the third transistor is off and the tone generator runs.

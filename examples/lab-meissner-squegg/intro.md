# An oscillator that switches itself on and off

A Meissner oscillator on a ferrite rod makes a medium-wave carrier, and a crystal set half a metre away listens. The transistor sets its own operating point: the more it oscillates, the more current it draws, and the voltage that current leaves on the emitter capacitor turns it down again. A slide switch puts a much bigger capacitor there; two more switches can turn the coupling winding round.

**Teaches:** phase condition of an oscillator, self-bias, squegging (self-interrupted oscillation)

## What to do

Click **Sim** and wait a few tens of milliseconds. Then switch on the **big bypass** and listen to the earphone. Switch it off again. Finally flip **both coupling switches** over.

## What you should see

- Big bypass off: the transmitter runs steadily (its tank swings about 9 V); the receiver gets a steady carrier and the earphone stays quiet.
- Big bypass on: the oscillation keeps starting and stopping — about eight hundred times a second. The earphone buzzes with a tone near 0.8 kHz: the carrier has been keyed by a tone.
- With the winding reversed nothing oscillates at all.

## Why it works

While it oscillates, the transistor rectifies its own drive, draws more current and charges the emitter capacitor, which turns it down. With the small capacitor that happens in a microsecond, much faster than the oscillation can grow or fade, so the two settle together at one size. With the big one it takes a millisecond: the oscillation has grown long before the bias catches up, the bias then overshoots and cuts the transistor off, the oscillation dies, and only when the capacitor has discharged does it start again. Reversed, the coupling winding feeds back the opposite of what the tank is doing, so every start is cancelled.

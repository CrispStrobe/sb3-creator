---
level: beginner
age: 10+
prereqs: [lab-astable-tone]
teaches: [astable, frequency, sound]
---
## What you see
Three transistors, two buttons and a small magnetic earphone. Two of the transistors switch each other on and off; the third switches the earphone.

## Try this
1. Click **Sim**. Silence: no button is pressed.
2. Hold **LOW**: a low note in the earphone.
3. Let go and hold **HIGH**: a higher note.
4. Hold both at once: higher still.

## What is going on
Each button connects its own resistor to the first transistor's base. Through that resistor a capacitor recharges after every switching, and only when it has recharged does the transistor switch on again. A smaller resistor (33 kΩ on HIGH instead of 100 kΩ on LOW) recharges it faster, so the circuit switches more often and the note is higher. With no button, nothing recharges that base at all: the circuit stops and stays quiet. That is all a two-tone doorbell needs.

## Go further
- [lab-npn-four-tone-keys](../lab-npn-four-tone-keys) — four notes from two buttons.
- [lab-astable-tone](../lab-astable-tone) — the same kind of oscillator, from clicks to a tone.

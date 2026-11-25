---
level: intermediate
age: 10+
prereqs: [lab-npn-two-tone-bell]
teaches: [astable, rc-charging, frequency, sound]
---
## What you see
A transistor tone generator in which one base resistor is not connected to the battery but to an electrolytic capacitor. A button charges that capacitor; a slide switch adds a second, bigger one.

## Try this
1. Click **Sim**. Silence: the capacitor is empty.
2. Hold the button: a tone starts and slides upward.
3. Let go: the tone slides down again and fades out.
4. Move the **SLOW** slide switch to add the big capacitor and try again: now the tone swells and dies away much more slowly.

## What is going on
Every time the first transistor switches off, its base has to be recharged through its 47 kΩ resistor before it switches on again. Here that resistor is fed from the bias capacitor. The higher its voltage, the faster the base recharges and the higher the pitch. The button fills the capacitor through 2.2 kΩ, so the pitch rises; after you let go, the transistor's base itself slowly empties it, the pitch sinks, and below about 0.6 V the oscillator stops. A bigger capacitor takes longer both ways.

## Go further
- [lab-siren-glide](../lab-siren-glide) — a gliding siren made with a timer chip.
- [lab-npn-police-siren](../lab-npn-police-siren) — a siren that jumps between two notes.

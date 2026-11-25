# The mixer as an RF amplifier with gain control

A mixer chip whose oscillator is held still does not mix any more: its switches stay put and it simply amplifies the difference between its two inputs. Here a dual-gate MOSFET feeds it the station twice, upside down from its drain and right way up from its source, and the second gate of the MOSFET is the volume knob for the radio signal.

**Teaches:** phase splitter, differential amplifier, dual-gate MOSFET gain control

## What to do

Click **Sim** and listen. Move the **OUTPUT** switch to the other side and listen again. Then turn **GAIN** all the way to 1.

## What you should see

- The station's tone from the loudspeaker; the same from the other output.
- At GAIN 1 the station gets quieter: the RF at the mixer's outputs falls to about half.

## Why it works

With equal resistors at drain and source, the MOSFET's current makes the drain fall exactly as much as the source rises: two copies of the station in antiphase. The mixer amplifies their difference, so the signal counts twice. Gate 2 sits over the upper half of the channel: pulled down below the source by more than the pinch-off voltage, it squeezes the channel shut and the stage's gain falls — the way FM and TV tuners keep strong stations from overloading them.

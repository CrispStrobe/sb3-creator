# An untuned ferrite rod hears all stations at once

A radio's ferrite rod antenna normally sits in a tuned circuit that picks one station. Leave the tuning capacitor out, put the rod's winding on a transistor amplifier, and you hear every station at once, jumbled together. One small capacitor makes them all disappear.

**Teaches:** a junction detects radio signals, a tuned circuit selects them, a capacitor bypasses radio frequencies

## What to do

Click **Sim** and listen. Then move the slide switch to the right: it puts a 4.7 nF capacitor from the transistor's base to ground. Move it back. Turn the knob of the field probe (your hand, held near the rod over a sheet of paper) up and down.

## What you should see

- Without the capacitor: the stations' programmes play together in the loudspeaker; the LED flickers with them.
- With the capacitor: the stations are gone.
- Hand close: a low hum.

## Why it works

Every station's radio wave makes a tiny voltage in the rod's winding. Nothing is tuned, so all of them reach the transistor's base. The base–emitter junction conducts more in one direction than the other, so it turns each station's radio wave back into its sound: they all come out at once. The 4.7 nF capacitor is almost a short circuit for radio frequencies (about 34 Ω at 1 MHz) but hardly touches the sound, so the stations no longer reach the junction. Your body picks up the hum of the mains wiring in the room and passes it on to the base.

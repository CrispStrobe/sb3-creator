# Light guide: bends, cuts, colours

A red LED shines into a plastic light guide; at the far end a phototransistor turns the light back into a voltage. The meter shows how much light made it through.

**Teaches:** total internal reflection, bend loss, cut quality, fibre attenuation by colour

## What to do

Click **Sim** and read the meter. Turn the light guide's knob to make the bend tighter. Then try the inspector: set the guide's `cutQuality` to 0, change the LED's colour to green or ir, or make the guide longer (`lengthM`).

## What you should see

- About 2.1 V with the gentle 3 cm bend.
- A tight 4 mm bend: about 1.1 V. Light leaks out of the bend.
- Rough ends: only about 0.26 V.
- Green light arrives weaker than red. Infrared does well over half a metre but fades away over three.

## Why it works

Light hitting the wall of the fibre at a shallow angle is reflected back completely, so it follows the fibre around corners. In a tight bend the angle becomes too steep and some light escapes. A ragged end scatters light in all directions. The plastic itself absorbs a little light per metre, and much more of infrared than of red.

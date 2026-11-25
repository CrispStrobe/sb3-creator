# Proximity switch: two fibre ends and a relay

Two pieces of light guide, end to end: as long as they almost touch, light crosses from one to the other and a relay switches on. Move them apart and it switches off. A switch with no moving contact at the sensor.

**Teaches:** light coupling between fibres, relays, switching hysteresis

## What to do

Click **Sim**. Move the knob of the light path (the gap between the two fibre ends) slowly from 0 towards 5 mm, then slowly back.

## What you should see

- Close together: the relay is in and the yellow LED lights.
- Opening the gap: the relay drops out between 1.5 and 2 mm.
- Closing it again: it pulls in only below 1.5 mm, a little closer than where it let go.

## Why it works

Light comes out of a fibre end as a cone. The second fibre only catches the part of the cone that falls on its core, and that shrinks quickly with distance. The phototransistor turns the light into a current that switches the transistor and the relay. A relay needs more coil current to pull in than to stay in, so it switches on and off at slightly different gaps and does not flutter at the threshold.

# Finding a station's direction with the ferrite rod

There is no long-wire antenna on this bench: the ferrite rod itself is the antenna. It picks up the magnetic part of the radio wave and hears a station best when it lies across the wave's direction — and not at all when it points straight along it. Turn the rod and watch the meter: the sharp null tells you which way the station is.

**Teaches:** antenna directivity, the figure-eight pattern of a loop/rod antenna, radio direction finding

## What to do

Click **Sim**. Turn the small dial above the coil (the rod's angle, 0–360°) slowly through a full turn and watch the meter. Then tune to the other station (tuning knob near 0.19) and do it again.

## What you should see

- The meter rises above its resting current when the rod receives the station and falls back to rest in a sharp null.
- With the tuning at 0.4 (the 700 kHz station) the nulls are at 90° and 270°: the station is due north (0°).
- Tuned to the 1000 kHz station the nulls move to 160° and 340°: that station is at 70°.
- Each null is sharp, each maximum broad: the pickup follows |cos(angle − bearing)|.

## Why it works

The wave's magnetic field passes through the rod; the rod concentrates it inside the coil, and the field changing a million times a second induces a voltage in the winding. Only the part of the field along the rod counts, and that is the field times the cosine of the angle between the rod and the field. The field runs across the direction of travel, so a rod pointing at the station sees none of it. The transistor's base-emitter junction rectifies what the coupling winding passes on, so the collector current — on the meter — rises with the signal.

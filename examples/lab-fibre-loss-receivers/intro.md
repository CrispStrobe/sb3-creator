# Losses in a light guide: heard as pitch, read on a meter

Light that is lost on the way through a light guide can be heard and measured. One receiver turns the light into a pitch with the oscillator of a PLL chip, the other shows it on a meter through an op-amp.

**Teaches:** bending, gap, offset and angle losses in fibres, voltage-controlled oscillator, a linear op-amp receiver

## What to do

Click **Sim**. Move the light guide's slider down slowly: it bends the guide tighter. Then, in the inspector, give the light path a joint gap (`jointGapMm` 0.5), then an offset (`jointOffsetMm` 0.3), then an angle (`jointAngleDeg` 10), setting each back to 0 before the next.

## What you should see

- Gentle bend: about 290 Hz and about 4 V on the meter.
- Tight bend (below 1 cm radius): the note drops and the meter falls, to about 2 V at 0.4 cm.
- Joint gap 0.5 mm: about 150 Hz and 1.6 V. An offset or an angle at the joint loses light too.

## Why it works

Light stays inside the guide because it meets the wall at a shallow angle. In a tight bend part of it hits the wall too steeply and escapes. At a joint the light leaving the first piece spreads out, so a gap, a sideways shift or a tilt makes part of it miss the second piece. The phototransistor turns the light that arrives into a voltage; the PLL's oscillator turns that voltage into a pitch and the op-amp doubles it for the meter.

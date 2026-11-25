# A tone switched by static charge

A MOSFET whose gate is only a short bare wire switches a tone generator. Bring a charged plastic ruler near the wire: the tone starts, and it keeps going while you hold the ruler still. Take the ruler away and it stops.

**Teaches:** depletion MOSFET, insulated gate, electric field, induced charge

## What to do

Click **Sim**. Move the ruler's distance knob (field_probe_12) to about a third and listen; watch the red LED (led_15). Hold it there, then turn it back to zero.

## What you should see

- No ruler: red LED on, speaker silent.
- Ruler near: the LED goes out and a tone of about 280 Hz sounds.
- Ruler held still: the tone goes on. Ruler away: silence, LED on again.

## Why it works

This MOSFET conducts on its own when its gate is at zero volts; a negative gate shuts it. The rubbed ruler carries negative charge, and bringing it near pushes charge around on the bare wire, making the gate negative. While the MOSFET conducts it holds the tone generator's input low; once it is shut, the generator runs. The gate is insulated, so the charge stays as long as the ruler does not move.

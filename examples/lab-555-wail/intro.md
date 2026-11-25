# Siren and wail on the control pin

A tone that glides up and down. Hold the button and the pitch climbs like a siren; let go and it falls back. Or let a second, very slow timer do it for you: a wail.

**Teaches:** control voltage, voltage-controlled oscillator, RC ramp

## What to do

Click **Sim** and listen: on the left (WAIL) the slide switch (slide_switch_8) lets the tone wail by itself. Move the slide switch to the right (SIREN): hold the button (button_9) for a couple of seconds, then let go.

## What you should see

- WAIL: the pitch rises and falls about every one and a half seconds.
- SIREN: while you hold the button the pitch climbs from about 840 Hz to about 1370 Hz; when you let go it glides back down.

## Why it works

The tone generator compares the voltage on its timing capacitor with two switching voltages set by its control pin. A big capacitor on the control pin pulls those switching voltages slowly up or down. Lower switching voltages are reached sooner: a higher tone. The button empties the big capacitor through a resistor, so the change is a glide, not a jump.

# Colour to pitch: an LED sets the tone

Red, green and other LEDs need different forward voltages to light. Put an LED in the charging path of an amplifier's tone oscillator and that voltage decides how fast the capacitor charges: each colour has its own note. This is how a simple aid can tell colours apart by sound.

**Teaches:** LED forward voltage by colour, RC charging, an amplifier as a tone oscillator

## What to do

Click **Sim** and listen. Flip the colour slide switch from red to green, then flip the capacitor slide switch to the larger capacitor.

## What you should see

- Red LED: a tone of about 880 Hz; the LED glows.
- Green LED: lower, about 800 Hz.
- Larger capacitor: much lower, about 180 Hz.

## Why it works

The amplifier flips its output between high and low whenever the capacitor's voltage crosses one of two switching points. While the output is high, the capacitor charges through the resistor and the LED. The LED keeps its forward voltage for itself, so a green LED, which needs more voltage than a red one, leaves less to drive the charging current: the capacitor takes longer, and the note is lower.

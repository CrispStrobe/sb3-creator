# Telling LEDs apart by ear

An op-amp tone generator whose pitch follows the difference between an LED's forward voltage and a knob. Tune the knob until the tone stops for the red LED; then switch to the green one and listen — its higher forward voltage brings the tone back.

**Teaches:** LED forward voltage, voltage-to-frequency converter, null method

## What to do

Click **Sim** with the red LED in the socket (slide_switch_5 left). Turn NULL (potentiometer_9) slowly up until the tone stops; voltmeter_22 then reads about zero. Now slide the switch to the green LED.

## What you should see

- Red: a low tone that gets lower and stops as you turn NULL up.
- Green, same knob: a clear tone of about 800 Hz.

## Why it works

The integrator's output runs down as fast as the LED's voltage exceeds the knob's; each time it reaches the bottom threshold the comparator throws it back up, and that is one cycle of the tone. No difference, no running down, no tone. A green LED needs about 0.3 V more than a red one to conduct, so it brings the tone back.

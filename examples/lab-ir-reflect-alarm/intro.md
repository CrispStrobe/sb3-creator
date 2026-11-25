# Reflective infrared alarm

An infrared LED blinks a thousand times a second; a phototransistor beside it waits for the blinks to come back from something in front. An op-amp filter listens only to that blinking, a latch remembers the alarm, and an amplifier IC sounds it until you press RESET.

**Teaches:** modulated light, band-pass filter, rectifier, latching alarm

## What to do

Click **Sim**. Turn the light path's distance knob (light_path_48) slowly from 20 cm down to 3 cm and watch the meter (analog_meter_25). Turn it back to 20 cm, then hold RESET (button_31) for a moment. Try raising the phototransistor's light slider (phototransistor_14) on its own.

## What you should see

- The meter rises as the object comes closer; at about 3 cm the ALARM LED (led_34) lights and the loudspeaker sounds.
- Moving the object away changes nothing; RESET silences it.
- Room light alone does not set it off.

## Why it works

Only the reflected IR blinks at the transmitter's frequency, and the band-pass filter passes only that frequency; steady light is a constant the filter ignores. A diode turns the filtered blinks into a voltage; when it passes the threshold the comparator switches and holds itself on, and its output releases the tone generator.

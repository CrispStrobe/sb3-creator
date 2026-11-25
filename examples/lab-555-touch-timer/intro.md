# Touch timer with a hum guard

Touch the sensor and a relay switches a lamp on for a couple of seconds. But a bare sensor wire is also an aerial: near a mains cable it picks up hum and switches on by itself. A resistor and a capacitor guard it.

**Teaches:** monostable timer, high-impedance inputs, interference

## What to do

Click **Sim**. Press the finger button (button_11) briefly: the lamp lights for about 2.4 s. Turn the knob of the field probe (field_probe_13) all the way up: a mains cable right next to the sensor wire. Nothing happens. Now open GUARD (switch_8).

## What you should see

- Finger: relay (relay_14) and lamp on for about 2.4 s.
- Cable close with GUARD closed: nothing.
- Cable close with GUARD open: the lamp switches on by itself.

## Why it works

The timer starts when its trigger input drops below a third of the supply. Your finger pulls it down through your skin. Without the guard the input is held up only by a huge resistor, so the tiny current the mains cable induces through a few picofarads moves it by many volts – enough to start it. The guard's smaller resistor and capacitor short that hum out, but your finger still gets through.

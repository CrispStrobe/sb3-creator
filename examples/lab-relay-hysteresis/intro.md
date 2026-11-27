# Relay hysteresis: in at one voltage, out at another

A relay does not switch at one voltage but at two. It pulls in only when the coil gets enough voltage, then holds on with much less, and lets go only far lower down. In between it remembers what it was doing.

**Teaches:** pull-in and drop-out voltage, hysteresis, a relay as memory, emitter follower

## What to do

Click **Sim**. Turn LEVEL (potentiometer_3) slowly up and watch the coil voltmeter (voltmeter_8) and the two LEDs. When the relay clicks in, turn LEVEL slowly back down. Then park LEVEL at the middle (0.5) and press TAP (button_9) once.

## What you should see

- Going up: OUT (led_15, green) stays lit until the coil reaches 6 V (LEVEL about 0.84); then the relay clicks in and IN (led_13, red) lights.
- Going down: the relay stays in at 5 V, 4 V, 3 V. It lets go only at 2.5 V (LEVEL about 0.4).
- Going up again from there: it stays out until 6 V once more.
- At LEVEL 0.5 (about 3.1 V on the coil) the relay is out. One tap on TAP pulls it in, and it stays in after you let go.

## Why it works

The transistor copies the knob's voltage onto the coil and supplies the current the knob alone could not. To pull the armature across its air gap the coil needs a strong field; once the armature touches the core the gap is closed and a much weaker field holds it. So the switch-on and switch-off points are far apart, and between them the relay keeps its last state. TAP sends a short push through a capacitor: the coil sees over 8 V for a few milliseconds, enough to pull in, and the holding voltage of 3.1 V keeps it there.

# When does blinking turn into steady light?

Above a certain rate the eye stops seeing flashes and merges them into steady light. This circuit lets you find that rate. A 555 makes an adjustable clock, a flip-flop halves it so the LED is on and off for exactly equal times, and the knob sweeps the LED from about 30 to over 200 flashes per second.

**Teaches:** divide-by-two for a 50 % duty cycle, flicker fusion, why fast pulsed dimming looks smooth

## What to do

Click **Sim** and turn the knob slowly from 0 upwards. Watch the LED and the scope. On a real breadboard, look at the LED from the side as well, where the eye is more sensitive to flicker.

## What you should see

- Knob at 0: the LED flashes about 31 times a second.
- Turning up: the flicker fades; above roughly 60 to 90 Hz the LED looks steady.
- The on-screen LED is redrawn only a limited number of times per second, so read the frequency from the scope.

## Why it works

A D flip-flop whose D input is fed from its own inverted output changes state on every clock edge: two edges in, one full cycle out. That makes a perfect half-and-half square wave, whatever the shape of the 555's own output.

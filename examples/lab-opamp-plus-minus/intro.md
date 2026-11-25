# The op-amp on a plus-minus supply

Two batteries give +9 V, 0 V and −9 V. An op-amp comparator on a pot across all of it is almost impossible to balance, and two back-to-back LEDs show where conduction starts in each direction.

**Teaches:** bipolar supply, open-loop gain, LED thresholds in both polarities

## What to do

Click **Sim**. Turn the INPUT knob (potentiometer_5) slowly through the middle and watch the comparator's red and green LEDs (led_8, led_9). Then watch the meter across the second LED pair (voltmeter_13) while you turn the knob all the way up and all the way down.

## What you should see

- The comparator's LEDs swap at the very middle: no knob position leaves both dark.
- The pair's meter follows the input meter (voltmeter_14) up to about +1.7 V and down to about −2 V, then stops; that is where the red or the green LED of the pair starts to glow.

## Why it works

The op-amp amplifies the difference between its inputs about 100 000 times, so a millivolt is already enough to drive its output to one end. The follower copies the input exactly; the LEDs carry no current until the voltage across them reaches their threshold, and from then on they hold it.

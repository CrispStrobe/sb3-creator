# Op-amp Schmitt trigger

A comparator with a little positive feedback no longer has one switching point but two: up at one voltage, down at a lower one. In between it remembers where it came from.

**Teaches:** Schmitt trigger, hysteresis, positive feedback, comparator

## What to do

Click **Sim**. Turn the input knob (potentiometer_3) slowly up until the red LED comes on and note the voltmeter (voltmeter_4); then turn it slowly down until green comes back and note it again. Open the feedback switch (switch_7) and do the same.

## What you should see

- Feedback in: red at about 5.5 V going up, green again only at about 3.8 V going down. Stop in between, and the LED shows the direction you came from.
- Feedback out: both at 4.5 V — one threshold.

## Why it works

When the output goes high, the feedback resistor lifts the + input a little further: the input now has to fall well below the switching point before the output can drop. When the output is low it pulls the + input down, so the input has to rise above the switching point first. A small wobble on the input can no longer make the output chatter.

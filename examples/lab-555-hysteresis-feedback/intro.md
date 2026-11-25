# How feedback sets the hysteresis

A transistor and a 555 make a switch with a gap between "on" and "off". A feedback resistor from the 555's output makes that gap narrower – and if you make it too small, the switch starts to oscillate.

**Teaches:** hysteresis, feedback, why too much feedback makes a circuit oscillate

## What to do

Click **Sim**. Turn INPUT (potentiometer_3) slowly up until the red LED lights, then slowly down until it goes out. Note both positions. Turn FEEDBACK (potentiometer_12) to the middle and repeat; then to three quarters. Finally turn FEEDBACK all the way up and move INPUT between 0.2 and 0.6.

## What you should see

- FEEDBACK at 0: on at about 0.39, off at about 0.25.
- In the middle: about 0.38 and 0.26; at three quarters about 0.35 and 0.28 – the gap closes.
- FEEDBACK all the way: below about 0.5 the LED flickers very fast; above it stays on.

## Why it works

The 555 switches its output high when its input falls below 3 V and low again only above 6 V. The feedback resistor feeds a little of the output back to the input – the wrong way: when the output goes high it lifts the input towards the "off" point. The smaller the resistor, the bigger that push and the smaller the gap. When the push is bigger than the whole 3 V gap, every switch causes the next one: it oscillates.

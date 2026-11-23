---
level: intermediate
age: 12+
prereqs: [pc54-opamp-follower, pc06-rc-charge]
teaches: [voltage-follower, RC-ramp, source-and-sink, LED-forward-voltage]
---
## What you see
Two buttons and two LEDs. Hold TO GREEN and the light slowly slides from red to green; hold TO RED and it slides back. Let go and it stays where it is.

## Try this
1. Start the simulation: red is on, green is off.
2. Hold TO GREEN for about two seconds and watch the light cross over. Release it halfway: the colour mix freezes.
3. Watch the voltmeter while you do this. Where is it when both LEDs look equally bright?
4. Hold TO RED to fade back.

## What is going on
The buttons charge or discharge a capacitor through 100 kΩ, which takes around a second: that is the slow ramp. A capacitor cannot drive LEDs itself (they would empty it at once), so an op-amp follower copies its voltage to a strong output. One LED hangs from that output up to +9 V, the other from the output down to ground. When the output is low, the upper (red) LED has most of the voltage; when it is high, the lower (green) one does. In between both share it. Notice that the follower cannot reach the very top or bottom: real op-amp outputs stop short of their supply rails, and the LED currents push them further in.

## Go further
- [pc54-opamp-follower](../pc54-opamp-follower): the follower on its own.
- [lab-opamp-follower](../lab-opamp-follower): why a follower does not drain its source.

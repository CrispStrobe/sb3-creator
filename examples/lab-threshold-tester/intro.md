# Junction threshold tester with a twin transistor

A transistor switches its LED on when its base reaches about 0.6 V. That threshold gets in the way when you want to measure the threshold of something else. The trick: start the test pot not at 0 V but on the base–emitter drop of a second, identical transistor. The two thresholds cancel, and so does their drift with temperature.

**Teaches:** junction thresholds of silicon, germanium and LEDs, compensation with a matched junction

## What to do

Click **Sim**. The left slide switch picks the pot's reference: the twin transistor (left) or ground (right). The next three slide switches put a junction in front of the indicator transistor: none, a germanium diode, a red LED or a green LED. For each one, turn the test pot up slowly from 0 until the yellow LED lights, and read the voltmeter. Then drag both transistors' **Temperature** sliders to 70 °C and measure again.

## What you should see

- Twin reference: with nothing in front the LED lights almost at once (about 0.04 V); germanium diode about 0.12 V; red LED about 1.3 V; green LED about 1.6 V.
- Ground reference: everything about 0.67 V higher, because the indicator's own threshold is now in the reading.
- At 70 °C: the twin-referenced readings stay put; the ground-referenced one falls by about 90 mV.

## Why it works

Both transistors are built alike and carry similar currents, so their base–emitter drops are alike and change alike with temperature (about −2 mV per degree). With the pot sitting on the twin's drop, the indicator switches on exactly when the voltmeter has covered the threshold of whatever is in between. The tiny test currents make the LEDs read lower than their usual 2 V.

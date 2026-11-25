# Precision AC voltmeter: average against peak

An alternating voltage changes all the time, so what number should a meter show? This meter can show two: the average of the rectified wave, or its peak. An op-amp rectifies so precisely that even a tenth of a volt can be measured.

**Teaches:** precision rectifier (superdiode), average, peak and RMS values, measuring ranges

## What to do

Click **Sim** and open the oscilloscope. Read the meter with **MODE** on average, then slide MODE to peak. Then slide MODE back to average, turn **LEVEL** right down (about 5 %) and slide **RANGE** to 100 mV.

## What you should see

- Average: about 0.56 V. Peak: about 1.8 V, roughly three times as much.
- On the 100 mV range a signal twenty times smaller still gives a clear reading.

## Why it works

An ordinary diode needs 0.6 V before it conducts, which would swallow small signals completely. Inside the op-amp's feedback loop the op-amp simply drives its output 0.6 V higher, and behind the diode the voltage follows the input exactly as long as it is positive. The meter then sees the half waves: averaged by the capacitor they give peak/π; with the capacitor straight on the output it keeps the peak. For a sine the RMS value, the one that heats a resistor like DC does, is peak/√2.

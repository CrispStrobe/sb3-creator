# Logarithmic amplifier with a diode

A diode's voltage does not follow its current in proportion: it grows with the logarithm of the current. Put a diode in the feedback path of an op-amp, and the output becomes the logarithm of the input. Multiply the input by ten and the output goes up by the same small step every time.

**Teaches:** the exponential diode law, analog computing, logarithms turn multiplication into addition

## What to do

Click **Sim**. Turn the knob so that the input voltmeter reads about 0.09 V, then 0.9 V, then 9 V, and read the output meter each time.

## What you should see

- 0.09 V in: about 4.73 V on the meter.
- 0.9 V in: about 5.33 V.
- 9 V in: about 5.92 V.
- Each step of ten adds about 0.6 V.

## Why it works

The op-amp sends the input current back through the diode. A silicon junction needs about 60 mV more for every tenfold increase in current, so the diode voltage, and with it the output, counts decades instead of volts. The second op-amp just multiplies by ten so the meter is easy to read.

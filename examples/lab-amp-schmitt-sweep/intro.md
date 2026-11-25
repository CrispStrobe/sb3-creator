# The amplifier as a Schmitt trigger

An audio amplifier chip with a little of its output fed back to its own input stops amplifying and starts switching. Sweep the input with the knob and watch the voltmeter: it switches on at one voltage and off at a lower one.

**Teaches:** Schmitt trigger, positive feedback, hysteresis

## What to do

Click **Sim**. Turn the INPUT knob (potentiometer_6) up slowly and note the voltmeter reading (voltmeter_9) when the red LED comes on. Then turn it back slowly and note the reading when the green LED comes back.

## What you should see

- At the start: green LED on, red off.
- Turning up: the red LED comes on at about 2.3 V, and the green goes out.
- Turning back: the red LED stays on until about 1.6 V, then the green takes over again.

## Why it works

The chip compares its + input with 1.2 V on its − input. The + input gets about half of the knob's voltage, plus a small share of the output. While the output is low that share is small, so the knob has to go high to reach the switching point. Once the output is high, its share helps, so the knob has to come down a long way before the output drops again.

# Half-hour timer with a relay

A large capacitor charges slowly through a large resistor; an op-amp watches it and holds a relay in until it has passed two thirds of the supply. With the time knob in the middle that takes half an hour.

**Teaches:** RC timing, comparator with hysteresis, relay driver

## What to do

Click **Sim**. The range slide switch (slide_switch_5) starts on the left, minutes: the lamp is lit and stays lit for half an hour. To see it in seconds, move the slide switch to the right (a capacitor a hundred times smaller) and press START (button_8). Turn the time knob (potentiometer_4) and press START again.

## What you should see

- Seconds range, knob as built: the lamp goes out after about 18 s. Minutes range: after about 30 min.
- START empties the capacitor and the time begins again.
- The knob turned up: shorter, down to about half a second (about a minute on the minutes range); turned down: up to about 25 s (42 min).

## Why it works

The op-amp's − input follows the capacitor, its + input sits at 6 V. While the capacitor is below that, the output is high and the transistor holds the relay in. The time to reach 6 V is 1.13 × R × C, so a hundred times the capacitance gives a hundred times the time.

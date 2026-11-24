---
level: advanced
age: 14+
prereqs: [lab-mosfet-current-source]
teaches: [mosfet, depletion-mode, pinch-off, voltage-controlled-resistor]
---
## What you see
A MOSFET with a green LED in its drain line and a red LED under its source. A knob sets the voltage of its first gate, and a voltmeter shows that gate voltage measured from the source.

## Try this
1. Click **Sim** and read the meter: the gate is a little negative, and the green LED is already on.
2. Turn the knob all the way down. The gate goes more and more negative, and the LED fades out.
3. Turn it up slowly and watch the meter: at what gate voltage does the LED start to glow? At what voltage is it fully on?
4. Press the button. It connects the gate to the source, so the gate voltage is zero. Does the LED light?

## What is going on
Between source and drain lies a thin conducting channel, and the gate sits on top of it, insulated by a layer of oxide. A negative gate pushes the charge carriers out of the channel and narrows it; at about −1.2 V it is pinched off completely. In a depletion-mode MOSFET the channel is already open at zero gate voltage, and a positive gate opens it even wider. To reach negative gate voltages with only one battery, the red LED lifts the source a little above ground: a gate at 0 V is then below the source. In between, the channel behaves like a resistor whose value you set with a voltage.

## Go further
- [lab-dual-gate](../lab-dual-gate) — the second gate can pinch the channel too.
- [lab-button-volume](../lab-button-volume) — the voltage-controlled channel as a volume control.

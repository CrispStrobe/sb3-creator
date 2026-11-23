# lab-nand-pips — expected behaviour

## Circuit
- 5 V supply, one 74HC132: four NAND gates with Schmitt-trigger inputs.
- Gate 1 is a slow oscillator: its output charges 1 µF through 470 kΩ, the capacitor feeds the gate's own input, the other input is tied high. Its output also lights a yellow LED through 470 Ω.
- Gate 2 is a tone oscillator with 22 kΩ and 100 nF. It drives the piezo through 10 kΩ. Its other input comes from the slide switch: gate 1's output (left, authored) or a steady high (right).
- Gates 3 and 4 are not used; their inputs are grounded.

## Observable behaviour
- Gate 1 needs about 0.6 s to charge its capacitor for the first time, then flips about 2.5 times a second; the yellow LED blinks with it.
- While gate 1's output is high, gate 2 oscillates at about 570 Hz: a pip. While it is low, gate 2's output stays high and the piezo is silent. Result: beep, beep, beep.
- Switch to the right: one continuous tone of about 570 Hz.
- A bigger capacitor or resistor on either gate makes that oscillator slower.

```assert
# power-on: both gate outputs high, gate 1 loaded by its LED
net vsource_2.pos V 5.00 +-0.01
net 74hc132_3.1y V 4.71 +-0.05
net 74hc132_3.2y V 4.99 +-0.02
```

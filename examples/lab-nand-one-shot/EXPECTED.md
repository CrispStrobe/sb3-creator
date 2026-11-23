# lab-nand-one-shot — expected behaviour

## Circuit
- 5 V supply, one 74HC132 (four Schmitt-trigger NANDs).
- Gate 1 inverts the button (10 kΩ pull-up). Pressed, its output goes high and fills a 1 µF capacitor through a diode and 100 Ω. 1 MΩ drains the capacitor.
- Gate 2 reads the capacitor. While it is charged, gate 2's output is low and the green LED (470 Ω from +5 V) is lit.
- Gate 3 inverts gate 2 and enables gate 4, a tone oscillator with 22 kΩ and 100 nF driving the piezo through 10 kΩ.

## Observable behaviour
- Idle: LED dark, piezo silent.
- Press the button: the capacitor charges to about 4.7 V within a millisecond, the LED lights and the tone starts, about 570 Hz.
- Release: the timer starts only now. The capacitor drains through 1 MΩ until it falls below gate 2's lower switching point; LED and tone stop about 0.97 s after release.
- Holding the button longer keeps it on; the time is always counted from release. The diode stops gate 1 from emptying the capacitor when the button is let go.

```assert
# idle: gate 1 low, gate 2 high (LED off), gate 3 low, tone gate resting high
net vsource_2.pos V 5.00 +-0.01
net 74hc132_3.1y V 0.00 +-0.02
net 74hc132_3.2y V 5.00 +-0.02
net 74hc132_3.3y V 0.00 +-0.02
net 74hc132_3.4y V 4.99 +-0.02
```

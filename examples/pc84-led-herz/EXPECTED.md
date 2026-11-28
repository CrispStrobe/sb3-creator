# pc84-led-herz — expected behaviour

## Circuit
One LM358 channel integrates the comparator’s output with a 100 kΩ resistor and a 4.7 µF feedback capacitor. The other channel uses 100 kΩ positive feedback and the triangle signal through 47 kΩ. Both channels use the 82 kΩ/51 kΩ divider (1.92 V) as reference. Each LED has its own 470 Ω resistor on the triangle output.

## Observable behaviour
- The integrator ramps between 1.18–2.81 V as the comparator switches between about 0.01 V and 3.50 V.
- LED current falls below 0.2 mA and rises to about 2.3 mA per LED.
- The LED brightness changes continuously with the triangle voltage.

## What this verifies
1. Integrator + comparator = triangle-wave oscillator
2. Analog dimming via triangle waveform (not PWM)
3. LM358 dual op-amp used as two functional blocks

```assert
# LM358 triangle oscillator: VCC = 5V, triangle swings around its divider reference
net vcc_1.pos V 5.00 +-0.01
```

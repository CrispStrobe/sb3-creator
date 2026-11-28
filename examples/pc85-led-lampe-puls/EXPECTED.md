# pc85-led-lampe-puls — expected behaviour

## Circuit
One LM358 channel integrates the comparator’s output with a 100 kΩ resistor and a 4.7 µF feedback capacitor. The other channel uses 100 kΩ positive feedback and the triangle signal through 47 kΩ. Both channels use the 68 kΩ/51 kΩ divider (2.15 V) as reference. Each LED has its own 470 Ω resistor on the triangle output.

## Observable behaviour
- The integrator ramps between 1.52–3.11 V as the comparator switches between about 0.01 V and 3.50 V.
- LED current falls below 0.2 mA and rises to about 2.9 mA.
- The LED brightness changes continuously with the triangle voltage.

## What this verifies
1. Simplified version of the breathing circuit (one LED)
2. Triangle wave produces smooth analog dimming

```assert
# LM358 triangle oscillator: VCC = 5V, single LED breathing
net vcc_1.pos V 5.00 +-0.01
```

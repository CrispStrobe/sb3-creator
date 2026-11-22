# lab-heat-alarm — expected behaviour

## Circuit
9 V. Sensor stage Q1: NTC thermistor (47 kΩ cold, 2.2 kΩ hot) from +9 V to the base, and from the base to ground
a 2.2 kΩ trimmer used as a variable resistor (at 0.77) plus 470 Ω. Q1's collector is Q2's base node, which is fed from
+9 V through 10 kΩ. Q2 switches a green "all is well" LED with 1 kΩ.

## Observable behaviour
- Cold (temperature slider at 0): Q1's base sits at about 0.18 V, Q1 is off, all of the 10 kΩ current goes into Q2's
  base and the green LED is fully on (about 7.1 mA).
- Warm the thermistor: its resistance falls, Q1's base voltage rises. Around the middle of the slider (about 0.45)
  Q1 starts to conduct, pulls Q2's base down and the LED goes out within a small step of the slider.
- Hot: Q1's base about 0.73 V, Q2's base about 0.02 V, the LED is dark.
- The trimmer moves the switching temperature: more resistance to ground means it switches at a lower temperature.

## Simulation note
In a real kit the sensor is the transistor itself: a silicon junction's voltage drops by about two millivolts per degree. The simulated
transistor has no temperature input of its own, so the thermistor in its bias network stands in for the heat.

## What this verifies
1. A temperature-dependent divider tips a transistor from off to on.
2. One transistor can switch another off by stealing its base current.

```assert
# cold: Q1 off, Q2 saturated, LED on
net npn_6.base V 0.18 +-0.03
net npn_8.base V 0.70 +-0.03
net npn_8.collector V 0.06 +-0.05
```

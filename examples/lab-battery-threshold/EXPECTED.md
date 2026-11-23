# lab-battery-threshold — expected behaviour

## Circuit
An adjustable source plays the battery under test (6 V as loaded). Three identical stages, each a divider onto the
base of an NPN with 1 kΩ and an LED in the collector. Upper resistor 22 kΩ in all three; lower resistor
4.7 kΩ (red), 3.3 kΩ (yellow), 2.2 kΩ (green).

## Observable behaviour
- A transistor starts to conduct once its base reaches about 0.68 V. Each divider gets there at a different supply:
  red from about 4 V, yellow from about 5.3 V, green from about 7.7 V.
- At 6 V red and yellow light (about 4.0 mA and 3.5 mA), green stays dark (its base only reaches about 0.55 V).
- At 3.5 V all three are dark; at 4.8 V only red; at 9 V all three.
- Each LED brightens over about a volt instead of switching sharply — there is no hysteresis.

## What this verifies
1. The divider ratio scales the threshold: V_threshold ≈ 0.68 V × (upper + lower) / lower.
2. The base–emitter voltage acts as a built-in reference.

```assert
# 6 V: red and yellow stages conducting, green stage below threshold
net vsource_2.pos V 6.00 +-0.01
net npn_5.base V 0.68 +-0.03
net npn_15.base V 0.55 +-0.03
# green stage: no collector current, so its 1 k drops nothing (the off
# collector itself is held by leakage alone and is not asserted)
net resistor_16.b V 6.00 +-0.01
```

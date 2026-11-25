# Twilight switch

When it gets dark the lamp switches on, when it gets light it switches off – but not at the same brightness, so it does not flicker at dusk.

**Teaches:** light sensor, Schmitt trigger, hysteresis

## What to do

Click **Sim**. Drag the light slider of the phototransistor (phototransistor_3) slowly up until the green DAY LED lights. Then drag it slowly down until the yellow LAMP LED lights again. Close NARROW (switch_7) and do it again.

## What you should see

- DAY switches on at about 0.55 light, LAMP comes back only at about 0.25.
- With NARROW: DAY at about 0.43, LAMP at 0.2 – the two points are closer together.

## Why it works

The more light falls on the phototransistor, the more current it passes and the higher the voltage on the 555's input. The 555 switches when the input passes 6 V and switches back only when it falls below 3 V. The resistor on its control pin lowers both switching voltages and brings them closer together.

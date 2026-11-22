# An LED that sees: photocurrent amplifier and night switch

An LED works backwards too: light falling on it produces a tiny current, a few microamps at most. An op-amp with a 1 MΩ feedback resistor turns that current into volts, and a second op-amp compares the result with a level you set. The result is a light meter and a twilight switch that needs no special light sensor.

**Teaches:** photocurrent, transimpedance amplifiers, comparators with an adjustable threshold

## What to do

Click **Sim** and read the meter: 4 V at the authored light level. Move the light slider of the sensor down slowly and watch the meter follow. Somewhere below half the night lamp switches on. Turn the knob to change where that happens.

## What you should see

- The meter shows one volt per microamp of photocurrent.
- Below about half light the yellow night lamp lights.
- The knob sets the switch-on level.

## Why it works

The op-amp keeps its inverting input at 0 V by pushing exactly the photocurrent back through the 1 MΩ resistor. To do that its output has to sit at current times resistance. In the simulator a photodiode stands in for the LED, because the LED model has no photocurrent; a real LED behaves the same way, only weaker.

# Is the lamp really on? Current-sensing fault monitor

A car's dashboard knows when a tail light has failed, without anyone walking round the car. The trick is a small resistor under the lamp: the current through it becomes a voltage, and a comparator checks that voltage. Lamp switched on but no current flowing means the bulb is blown or a wire is broken, and the fault LED lights.

**Teaches:** shunt current sensing, comparators, fault detection

## What to do

Click **Sim**. The lamp is on and the red fault LED is dark. Flip the bulb socket switch to "removed": the fault LED lights at once. Now switch the light off: the fault LED goes dark again, because a missing bulb only matters while the light is supposed to be on.

## What you should see

- Bulb fitted: about 0.9 V across the sense resistor, fault LED off.
- Bulb removed: no sense voltage, fault LED on.
- Light off: fault LED off whatever the bulb does.

## Why it works

The reference voltage comes from the same switched supply as the lamp, so it disappears when the light is off. The fault LED is powered from that supply too. Brake lights are checked the same way: the brake pedal is the light switch.

# Touch through paper

An NPN and a PNP transistor in a row multiply a tiny current by about 40 000. Their input is a metal plate under a sheet of paper. Press your finger on the paper and the LED lights, as long as the circuit runs from a mains adaptor.

**Teaches:** capacitive coupling, complementary amplifier, why mains-powered gadgets feel touch

## What to do

Click **Sim**. Turn the plate's knob from 0 (finger off) to 1 (finger pressed on the paper) and back. Then set the probe's `adaptorFarads` to 0 (battery instead of the adaptor) and try again.

## What you should see

- From the adaptor: the LED glows faintly at rest and much brighter while you press, flickering at 50 Hz.
- On a battery: pressing does nothing.

## Why it works

Through paper your finger and the plate form a capacitor of about 20 pF. A mains adaptor is tied to the mains through its own small capacitance, so the whole circuit swings by about 150 V against the earth you stand on. Your finger closes that loop: 50 Hz current flows through the paper into the NPN's base, and the transistor pair turns its positive half-waves into an LED current. On a battery the circuit floats with the room and almost nothing flows.

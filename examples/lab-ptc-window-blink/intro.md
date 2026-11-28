# Temperature window: green inside, a flashing warning outside

A temperature sensor's voltage is amplified by an op-amp and judged by two more op-amps against a lower and an upper limit. Two Schmitt NAND gates combine their answers: inside the window a green LED shows "all right"; outside it, too cold or too warm, an amplifier chip blinks a red warning LED.

**Teaches:** window comparators, combining two conditions with NAND gates, a gate enabling an oscillator

## What to do

Click **Sim**. Set the PTC's surroundings to 25 °C, then to 15 °C and 35 °C.

## What you should see

- 25 °C: the green LED is lit, the red one dark.
- 15 °C or 35 °C: the green LED goes out and the red LED flashes several times a second.

## Why it works

The PTC's resistance rises with temperature, so the voltage over it does too; op-amp 1 multiplies it by three. Op-amp 2 says "above the lower limit", op-amp 3 says "below the upper limit"; both are high only inside the window. NAND gate 1 then goes low, gate 2 inverts that to high: the green LED lights and a transistor holds the blinker's capacitor at 0 V, so it cannot oscillate. Outside the window the transistor lets go, the LM386 charges and discharges its capacitor, and its output switches a PNP transistor that drives the red LED.

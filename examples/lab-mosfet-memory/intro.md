# A MOSFET remembers: charge on the gate

A MOSFET's gate is insulated from the rest of the transistor. Put charge on it and it stays there, keeping the transistor (and an LED) switched on with nothing connected. That is a memory cell, the same idea as one bit of DRAM, just much bigger and slower.

**Teaches:** insulated gate, charge storage, leakage and refresh, voltage-controlled resistance

## What to do

Everything sits on one breadboard. Click **Sim** and hold "Write 1" for a second: the LED lights. Let go. The LED stays on even though nothing feeds the gate. Wait and watch it fade after 10 to 20 seconds, as the charge leaks away. Hold "Write 1" again to refresh it, or hold "Write 0" to erase it. Short taps on either button step the brightness.

## What you should see

- The LED stays on after you release "Write 1".
- It fades by itself within about 20 seconds.
- "Write 0" switches it off within about a second.

## Why it works

The gate and the capacitor together form a small charge store. The 1.5 MΩ resistor is the leak every real gate has, made much larger here so that you can watch it work. Real DRAM cells leak in milliseconds, so a memory chip rewrites every cell many times a second.

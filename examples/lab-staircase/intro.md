---
level: advanced
age: 14+
prereqs: [lab-opamp-blinker, lab-opamp-integrator]
teaches: [charge-pump, integrator, counting, staircase, analog-to-digital]
---
## What you see
A needle that climbs in equal jumps, one jump per blink of a red LED. After thirteen jumps it is at the top; press RESET and it falls back to zero and starts climbing again.

## Try this
1. Start the simulation and count: blink, jump, blink, jump. Each jump is about 0.56 V.
2. Put the scope on the integrator output: you see a staircase, flat between the steps.
3. Press RESET at any time. The staircase restarts from 0 V.
4. Work out the step size from C_pump, C_int and the clock swing before you measure it.

## What is going on
Every time the clock falls, the small 100 nF capacitor pushes the pump node negative. A diode lets it pull a fixed amount of charge out of the integrator, and the integrator raises its output by that charge divided by its 1 µF capacitor. When the clock rises, the other diode refills the small capacitor from ground. So each cycle moves the same packet of charge, and the output adds up the packets: it counts. Compare the staircase with a threshold and you have a simple analog-to-digital converter or a timer; let the steps leak away slowly and you have a meter for pulse rate.

## Go further
- [lab-opamp-blinker](../lab-opamp-blinker): the clock on its own.
- [lab-opamp-integrator](../lab-opamp-integrator): an integrator fed with a steady current.

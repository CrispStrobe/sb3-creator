# lab-opamp-integrator — expected behaviour

## Circuit
An op-amp integrator used as an analogue stopwatch. The op-amp is the simulator's generic op-amp with its output limited to −9 V … +7.5 V (the range of an LM358 on a ±9 V supply); its non-inverting input is at ground. C = 100 µF runs from the output back to the inverting input. R_in = 100 kΩ feeds the inverting input; the RUN switch connects R_in's other end to the −9 V rail (a 9 V source with its positive end at ground). RESET shorts the capacitor. An analog meter (7.5 V full scale) reads the output.

## Observable behaviour
- **Stopped (start):** RUN is open, no current flows into the capacitor, and the output sits at 0 V.
- **Running:** with RUN closed, 9 V / 100 kΩ = 90 µA flows out of the inverting input through R_in. The op-amp keeps that input at 0 V (a virtual ground), so the same 90 µA has to come through the capacitor, and the output climbs at a steady 90 µA / 100 µF = 0.9 V per second: 0.9 V after 1 s, 1.8 V after 2 s, 4.5 V after 5 s. The needle moves like a clock hand.
- **A straight line:** the climb rate does not change as the output rises, because the current is set by R_in and the fixed 9 V, not by the capacitor's voltage. (A plain RC charge slows down as it goes.)
- **Full scale:** after about 8.3 s the output reaches its upper limit and stops.
- **Hold:** opening RUN again stops the current; the output stays where it is.
- **RESET** empties the capacitor: back to 0 V.

## What this verifies
1. An integrator's output is proportional to the input current added up over time: U_out = I · t / C.
2. With a constant input the integral is a straight ramp, which is how an op-amp can measure time.

```assert
# RUN open
net amp.out V 0.00 +-0.01
```

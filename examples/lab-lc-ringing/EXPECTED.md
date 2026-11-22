# lab-lc-ringing — expected behaviour

## Circuit
- 5 V supply. In the "charge" position the slide switch connects C1 = 1 µF to the supply through R1 = 100 Ω.
- In the "ring" position it connects the charged capacitor across the coil L1 = 100 mH, in series with R2 = 10 Ω, which stands for the resistance of the coil's winding.
- A second slide switch can put C2 = 3 µF in parallel with C1, four times the capacitance in total.

## Observable behaviour
- Charge position (authored): C1 sits at the full 5 V.
- Throw the switch to "ring": the capacitor voltage swings between plus and minus and dies away. The energy moves back and forth between the capacitor's electric field and the coil's magnetic field, and a little is lost in R2 on every swing.
- Ringing frequency, from f = 1 / (2π√(LC)): about 503 Hz with C1 alone, about 252 Hz with C2 added. Four times the capacitance halves the frequency.
- The swing shrinks to about a third every 20 ms, set by the coil loss: the time constant is 2L / R = 2 x 0.1 / 10 = 0.02 s. More resistance makes it die faster.
- The ringing is in the audio range, so it could also be listened to.
- To ring again, go back to "charge" first, then to "ring".

```assert
# charge position: C1 at the supply voltage
net c1.a V 5.00 +-0.01
net sw.a V 5.00 +-0.01
```

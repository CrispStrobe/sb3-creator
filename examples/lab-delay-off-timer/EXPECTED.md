# lab-delay-off-timer — expected behaviour

## Circuit
9 V. A button charges a 100 µF capacitor through 100 Ω. The capacitor drains through 47 kΩ into the base of
a Darlington pair (two NPN transistors, beta 100 each). The pair switches a yellow LED with 1 kΩ.

## Observable behaviour
- Idle: the capacitor is empty and the LED is dark.
- Press the button for a moment: the capacitor charges to almost 9 V at once and the LED lights (about 6.4 mA).
- Release: the LED stays fully lit for about 26 s while the capacitor slowly discharges into the Darlington.
- Then it fades over roughly another 15 s instead of snapping off: the Darlington needs only about 1.4 V and a tiny
  base current, so the end comes gradually as the capacitor voltage approaches that level.
- Ten times the capacitor or ten times the resistor gives roughly ten times the on-time.

## What this verifies
1. The on-time scales with R × C (47 kΩ × 100 µF = 4.7 s time constant, several of them before the end).
2. A simple RC timer has no sharp threshold, so it fades out.

```assert
# idle at t = 1 ms: capacitor empty, Darlington off
net vsource_2.pos V 9.00 +-0.01
net capacitor_5.a V 0.00 +-0.01
```

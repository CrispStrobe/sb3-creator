# lab-dual-gate — expected behaviour

## Circuit
9 V. A depletion-mode dual-gate MOSFET with a green LED and 470 Ω in its drain; its source sits on a red
reference LED (2.2 kΩ from +9 V keeps it lit, so the source is about 1.8 V above ground). Each gate has its
own 10 kΩ potentiometer, fed through 15 kΩ from +9 V (0 to 3.6 V), and its own button that grounds the gate,
which is about 1.8 V below the source.

## Observable behaviour
- Both knobs at the top (as loaded): both gates high, the green LED carries about 9.4 mA.
- Turn either knob down: the LED dims and goes dark once that gate is far enough below the source. Either
  gate alone can pinch the channel off.
- With one gate pinched, the other knob has no effect at all: the channel stays shut.
- Gate 2 (at the drain end) dims the LED sooner than gate 1 for the same knob setting: at mid travel the LED
  carries about 5.8 mA when gate 2 is turned down, about 7.6 mA when gate 1 is.
- Either button alone puts the LED out.

## What this verifies
1. One channel, two gates in series: either gate alone can pinch it off.
2. Depletion mode: a gate a little below its source is enough to switch the channel off.

```assert
# both knobs at the top: gates at 3.6 V
net dual_gate_mosfet_5.source V 1.81 +-0.05
net dual_gate_mosfet_5.gate1 V 3.60 +-0.05
net led_4.anode V 4.57 +-0.2
```

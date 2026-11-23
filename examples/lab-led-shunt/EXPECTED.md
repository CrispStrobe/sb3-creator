# lab-led-shunt — expected behaviour

## Circuit
Three small benches on one 9 V supply, all about current taking the easiest path.

1. **Series pair:** +9 V → 470 Ω → red LED (1.8 V) → green LED (2.2 V) → ground. A button sits across each LED (BYPASS RED, BYPASS GREEN).
2. **Unfair parallel:** +9 V → 470 Ω → green LED (2.2 V) → ground. The ADD RED button connects a red LED (1.8 V) straight across the green one.
3. **Transistor bypass:** +9 V → 470 Ω → yellow LED → ground, with an NPN from the LED's anode to ground. The SHUNT button feeds the base through 10 kΩ; 100 kΩ holds the base low when released.

## Observable behaviour

| Button held | red 1 | green 1 | green 2 | red 2 | yellow |
|---|---|---|---|---|---|
| none (all open) | 11.02 mA | 11.02 mA | 14.58 mA | 0 | 15.00 mA |
| BYPASS RED | 0 | 14.58 mA | | | |
| BYPASS GREEN | 15.42 mA | 0 | | | |
| both bypasses | 0 | 0 | | | |
| ADD RED | | | 0.00 mA | 15.42 mA | |
| SHUNT | | | | | 0 |

- **Series pair:** both LEDs carry the same 11 mA. Bypassing one removes its forward voltage from the loop, so the other one gets *more* current and glows brighter. Bypassing both leaves only the resistor: both dark.
- **Unfair parallel:** with ADD RED pressed the shared node falls from about 2.15 V to about 1.75 V. That is below where the green LED starts to conduct, so the red LED takes the whole current and the green one goes out. Parallel LEDs do not share fairly.
- **Transistor bypass:** pressing SHUNT saturates the NPN, its collector falls to about 0.09 V, and the yellow LED goes dark. The transistor is a button you can press with a small current.

## What this verifies
1. A short across a part steals its current (Kirchhoff's current law).
2. In parallel branches the one with the lower forward voltage wins.
3. A transistor can do the same job as a bypass button.

```assert
# nothing pressed
net led_red1.anode V 3.82 +-0.10
net r_par.b V 2.15 +-0.10
net q_shunt.collector V 1.95 +-0.10
```

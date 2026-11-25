# lab-magnet-speed — expected behaviour

## Circuit
- 9 V supply. Two identical air coils (500 turns, 15 mm radius, 30 mm long, 0.2 mm wire). A 0.05 A·m² magnet falls through the first (`air_coil_3`) from 2 cm above its centre, through the second (`air_coil_4`) from 40 cm.
- The slide switch (`slide_switch_5`) puts one coil on the LM386's +IN (`lm386_6`, gain 20); the other ends are grounded.
- The LM386 output drives an NPN (`npn_10`) through 2.2 µF and 10 kΩ, a 1N4148 from ground to its base; red LED with 470 Ω in its collector.

## Observable behaviour
- At switch-on the LM386 output rises to 4.5 V and kicks the transistor through the 2.2 µF: one flash, gone after a few tens of milliseconds.
- Slow magnet (first coil): a pulse of about 27 mV peak; the LED barely glows (about 1.1 mA at most).
- Fast magnet (second coil, about 4.5 times faster): about 91 mV; a bright flash (about 14 mA, the transistor saturates).

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs`; LED current from the drop across the 470 Ω.

| magnet | pulse (emfV) | LED peak |
|---|---|---|
| from 2 cm | 26.8 mV | 1.09 mA |
| from 40 cm | 90.9 mV | 13.98 mA |

## What this verifies
1. Induction needs change: the induced voltage grows with the magnet's speed.
2. An amplifier makes a small pulse visible.

## Simulation notes
The magnet is a point dipole falling freely (no air drag, no braking by the induced current). The pulse grows less than the speed (3.4 times for 4.5 times the speed) because a slow magnet also spends longer in the coil.

```assert
# power-on: supply and the amplifier settled at half the supply
net vsource_2.pos V 9.00 +-0.01
net lm386_6.vout V 4.50 +-0.05
net lm386_6.inp V 0.00 +-0.01
```


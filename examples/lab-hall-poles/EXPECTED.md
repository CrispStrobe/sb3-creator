# lab-hall-poles — expected behaviour

## Circuit
- 5 V supply. An analog Hall sensor module: its output sits at half the supply with no magnetic field and moves up for one pole and down for the other (its field slider runs from −1 to +1; +1 moves the output up by 2 V).
- A divider of 20 kΩ, 10 kΩ and 20 kΩ makes two reference voltages, 3.0 V and 2.0 V, either side of the no-field level.
- LM358 channel 1 lights the red NORTH LED when the Hall output rises above 3.0 V; channel 2 lights the green SOUTH LED when it falls below 2.0 V. Each LED has 220 Ω.
- A centre-zero moving-coil meter sits between the Hall output and a 2.5 V reference from two 1 kΩ resistors, so the needle shows size and sign of the field. It is a 50 µA movement on a 2 V range, so it draws at most 50 µA; the stiff reference hardly moves when the meter current flows through it (2.51 V at +0.5).

## Observable behaviour

| field slider | Hall output | meter | NORTH (red) | SOUTH (green) |
|---|---|---|---|---|
| +1 | 4.5 V | +1.97 V | ON | off |
| +0.5 (authored) | 3.5 V | +0.99 V | ON | off |
| +0.2 (weak) | 2.9 V | small | off | off |
| 0 | 2.5 V | 0 V | off | off |
| −0.2 (weak) | 2.1 V | small | off | off |
| −0.5 | 1.5 V | −0.99 V | off | ON |
| −1 | 0.5 V | −1.97 V | off | ON |

- Between the two references neither LED lights: a weak or distant magnet is ignored. The gap between the references sets how strong a field must be before the circuit reacts.
- The meter's needle swings left or right of centre with the pole, and further for a stronger (closer) magnet.

```assert
# field +0.5 (north): Hall output 3.5 V, references at 3.0 V and 2.0 V
net hall.ao V 3.50 +-0.01
net r_t.b V 3.00 +-0.01
net r_m.b V 2.00 +-0.01
net r_z1.b V 2.51 +-0.01
```

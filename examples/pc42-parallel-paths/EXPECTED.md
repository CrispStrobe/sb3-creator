# Parallel paths

Both branches see the same supply voltage (9 V).  Changing one branch
resistance alters its current but does not remove the voltage available
to the other branch.

## Expected LED state (steady-state)

| LED   | Resistor | Expected brightness | Current (approx.) |
|-------|----------|--------------------|--------------------|
| led1  | 470 Ω    | bright             | (9−2)/470 ≈ 14.9 mA |
| led2  | 1 kΩ     | dim                | (9−2)/1000 ≈ 7.0 mA |

Both LEDs must be ON simultaneously.  If neither lights, check vsource
wiring (pos→R→LED→GND, neg→GND).

```assert
# Supply: 9V source
net src.pos V 9.00 +-0.01
```

# Bleeder discharge

The bleeder resistor draws a small current while powered and discharges the
capacitor after power is removed. A smaller bleeder discharges faster but wastes
more standby power.

```assert
# Bleeder: supply 5V, tau_charge = 1k*1mF = 1s, tau_bleed = 10k*1mF = 10s
net src.pos V 5.00 +-0.01
```

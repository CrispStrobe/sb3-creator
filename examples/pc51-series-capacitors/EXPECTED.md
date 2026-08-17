# Series capacitors

The total capacitance is lower than either individual capacitor. After settling,
the voltage divides between the capacitors in inverse proportion to capacitance.

```assert
# Series caps: C_total = 1/(1/100u+1/200u) = 66.7uF, supply 9V
# Steady-state: V divides as C2/(C1+C2) and C1/(C1+C2) -> 6V and 3V
net src.pos V 9.00 +-0.01
```

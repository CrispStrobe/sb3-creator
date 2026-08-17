# Motor indicator

Closing the switch powers both the motor and a separate LED branch. The motor
branch draws its own current, while the resistor protects the indicator branch.

```assert
# Motor + LED indicator: supply 9V, LED branch through 1k
net src.pos V 9.00 +-0.01
```

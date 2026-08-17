# Two-stage RC

Each resistor-capacitor stage smooths the previous node. The second stage
reduces fast changes further, while its high-value load keeps the first stage
from being heavily disturbed.

```assert
# Two RC stages: tau1 = tau2 = 10k*100uF = 1s, supply 5V
net src.pos V 5.00 +-0.01
```

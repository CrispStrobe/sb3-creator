# Two-stage RC

Each resistor-capacitor stage smooths the previous node. The second stage
reduces fast changes further, while its high-value load keeps the first stage
from being heavily disturbed.

Both stages are 10 kOhm and 100 nF, so each corners at

    fc = 1 / (2*pi*R*C) = 1 / (2*pi*10000*1e-7) = 159.155 Hz

**The capacitors were 100 uF until 2026-08-25, which put both corners at
0.159 Hz.** That is not a physics choice, it is an instrument one: the AC sweep
measures each point by single-frequency correlation over `settleCycles = 6` plus
`measureCycles = 4` cycles, so a point costs 10/f seconds of SIMULATED time —
629 s a decade below a 0.159 Hz corner, against 0.63 s a decade below this one.
`signals-bode-sweep` asks the learner to sweep "at least a decade below and above
each expected corner", and on the old bench that request could not be answered.
The response shape is identical (the transfer function depends on R*C, and only
the frequency axis moves), so every slope, ratio and phase the lesson teaches is
unchanged; measured against the engine after the change:

| f (relative to fc) | f (Hz)  | magnitude  | phase    |
|--------------------|---------|------------|----------|
| fc/10              |  15.915 |  -0.456 dB |  -16.60° |
| fc/3.162           |  50.334 |  -2.437 dB |  -45.98° |
| fc                 | 159.155 |  -9.572 dB |  -89.62° |
| fc*3.162           | 503.248 | -22.344 dB | -133.28° |
| fc*10              | 1591.55 | -40.738 dB | -161.98° |

Slope one to two decades above the corner: **-36.64 dB/decade** — two poles,
short of the ideal -40 because the second stage loads the first, which is the
comparison `signals-bode-sweep`'s `explain` step exists to make.

```assert
# Two RC stages: tau1 = tau2 = 10k*100nF = 1 ms, supply 5V
net src.pos V 5.00 +-0.01
```

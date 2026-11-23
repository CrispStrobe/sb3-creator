# lab-power-matching — expected behaviour

## Circuit
A model of a real source: an ideal 6 V source (the EMF) in series with a 10 Ω resistor that stands for the source's internal resistance R_i. The source feeds an ammeter and then a 40 Ω potentiometer wired as a variable resistor (wiper joined to one end), which is the load. A voltmeter reads the voltage across the load, and the SHORT button connects the terminals directly.

## Observable behaviour
The load resistance is the pot position times 40 Ω. The ammeter adds about 0.1 Ω, so the numbers sit a hair below the ideal ones.

| LOAD position | R_load | U_load | I | P_load = U·I |
|---|---|---|---|---|
| 12.5 % | 5 Ω | 1.99 V | 0.397 A | 0.789 W |
| 25 % | 10 Ω | 2.99 V | 0.299 A | 0.891 W |
| 37.5 % | 15 Ω | 3.59 V | 0.239 A | 0.857 W |
| 50 % | 20 Ω | 3.99 V | 0.199 A | 0.795 W |
| 75 % | 30 Ω | 4.49 V | 0.150 A | 0.672 W |
| 100 % | 40 Ω | 4.79 V | 0.120 A | 0.574 W |

- **The terminal voltage sags under load:** U = E − R_i·I. The more current the load takes, the more of the 6 V is lost inside the source.
- **Short circuit:** pressing SHORT drops the load voltage to almost 0 V and the current rises to about 0.59 A. It cannot go higher, because E / R_i = 6 V / 10 Ω = 0.6 A is the most this source can ever deliver.
- **Maximum power at matching:** the power in the load is largest, about 0.89 W, when R_load equals R_i (10 Ω). Both a smaller and a larger load get less. At that point the source also wastes the same 0.89 W in its own internal resistance: matching gives the most power, not the best efficiency.

## What this verifies
1. A real source is an ideal voltage source plus an internal resistance (Thevenin model).
2. Short-circuit current is E / R_i.
3. Load power peaks when R_load = R_i.

```assert
# LOAD at 50 % (20 ohm)
net load.wiper V 3.99 +-0.02
net r_int.b V 4.01 +-0.02
```

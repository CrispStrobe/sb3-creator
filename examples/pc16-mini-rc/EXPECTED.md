# pc16-mini-rc — RC charging on a mini breadboard

## Circuit
10 kΩ in series with 100 µF on a 170-point mini breadboard (17 columns, no
rails). τ = 10 000 × 0.0001 = **1.0 s**.

Seating:

| part | lead | hole | column strip |
|---|---|---|---|
| R (10 kΩ) | a | a3 | col-t3 (+5 V) |
| R (10 kΩ) | b | a7 | col-t7 |
| C (100 µF) | a | b7 | col-t7 |
| C (100 µF) | b | b11 | col-t11 (return) |

Supply leads tap **e3** and **e11**. R and C meet through column strip t7 —
no drawn wire joins them.

## Expected (measured, `audit-solve pc16-mini-rc --at 0.001,1,100,1000,2000,3000,5000`)

Voltage on the capacitor (col-t7), power-on at t = 0:

| t | measured | fraction of 5 V | textbook |
|---|---|---|---|
| 0.001 ms | 0.0000 V | 0 % | 0 % |
| 1 ms | 0.0050 V | 0.1 % | 0.1 % |
| 100 ms | 0.4757 V | 9.5 % | 9.5 % |
| **1000 ms = 1 τ** | **3.1568 V** | **63.1 %** | 63.2 % |
| 2000 ms = 2 τ | 4.3202 V | 86.4 % | 86.5 % |
| 3000 ms = 3 τ | 4.7493 V | 95.0 % | 95.0 % |
| 5000 ms = 5 τ | 4.9657 V | 99.3 % | 99.3 % |

The curve is V(t) = 5 · (1 − e^(−t/τ)) to within 0.1 % at every sample.

## Observation conditions
Sub-millisecond samples show a flat 0 V — with τ = 1 s there is nothing to see
in the first millisecond. The timebase has to be seconds, not the default
1 ms, or this example looks dead when it is merely slow.

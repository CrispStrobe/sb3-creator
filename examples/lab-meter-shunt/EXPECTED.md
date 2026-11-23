# lab-meter-shunt — expected behaviour

## Circuit
- Three identical moving-coil movements: each a 1 kΩ coil rated for full deflection at a hundred microamps (the meter part in current mode, 100 µA full scale, no built-in shunt). The coil voltage at full scale is 0.1 V.
- A shunt in parallel with each coil turns it into a meter rated for ten milliamps: at full scale the shunt would take 99 parts of the current and the coil one part. Branch meters use 10.1 Ω; the total meter uses 10 Ω because the slide switch that can take it out adds about a tenth of an ohm of contact resistance.
- The network: 5 V through R1 = 100 Ω and the TOTAL meter to a node; from there branch A (R2 = 1 kΩ plus meter A) and branch B (R3 = 2.2 kΩ plus meter B) to ground.

## Observable behaviour

| meter | current | coil current | needle |
|---|---|---|---|
| total | 6.22 mA | 62.2 µA | 62 % |
| branch A | 4.27 mA | 42.7 µA | 43 % |
| branch B | 1.95 mA | 19.5 µA | 19.5 % |

- Kirchhoff's current law in needles: 4.27 + 1.95 = 6.22 mA, the two branch readings add up to the total.
- Each meter adds its own 10 Ω to the circuit. Branch A carries 4.315 / 1010 = 4.27 mA rather than the 4.32 mA a perfect meter would leave behind.
- Shunt switched out: the total meter's coil now carries the whole current, about 28 times its full-scale current, and the needle hits the end stop. The coil's 1 kΩ also sits in the circuit now, so both branch currents fall instead, to less than half their former values. Without a shunt a sensitive movement cannot measure milliamps, and it disturbs the circuit badly.

```assert
# shunts in: node voltages either side of the total meter
net r_feed.b V 4.378 +-0.01
net shunt_t.b V 4.315 +-0.01
net r_a.b mV 42.7 +-0.5
net r_b.b mV 19.5 +-0.5
```

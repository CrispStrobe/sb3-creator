# lab-mosfet-memory — expected behaviour

## Circuit
- N-channel MOSFET T1 (threshold 1.5 V) switches a yellow LED with its 220 Ω resistor from 5 V.
- The gate is a storage node: C1 = 10 µF to ground stands for the gate's charge store, R3 = 1.5 MΩ for the leakage that slowly drains it.
- "Write 1" charges the gate from 5 V through R1 = 47 kΩ; "Write 0" discharges it to ground through R2 = 47 kΩ.

## Observable behaviour
- At start the gate is at 0 V and the LED is dark.
- Holding "Write 1" charges the gate with a time constant of 47000 x 0.00001 = 0.47 s. After about half a second the LED is fully on (about 11.8 mA). The gate settles a little below 5 V because R1 and the leak form a divider.
- Releasing the button changes nothing at first: the charge stays on the insulated gate and keeps the LED on with no input at all.
- The leak empties the gate with a time constant of 1500000 x 0.00001 = 15 s. About 7 s after release the gate falls below 3 V and the LED starts to dim; by about 20 s it is dark. That is why dynamic memory must be refreshed.
- A short tap on "Write 1" only part-charges the gate. Because T1 conducts gradually over a band of gate voltages just above its threshold, short taps on the two buttons step the brightness up and down like a dimmer.
- Holding "Write 0" empties the gate in about a second.

```assert
# fresh start: gate empty, LED off, so the drain sits near the supply
net m1.gate V 0.00 +-0.01
net m1.drain V 4.99 +-0.05
```

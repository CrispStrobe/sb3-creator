# lab-linear-ohmmeter — expected behaviour

## Circuit
- 9 V for one section of an LM324 (`lm324_5`); its + input is on ground. The other three sections are parked.
- A 1.5 V cell (`vsource_4`) is the reference: its + pole on ground, its − pole on the bottom of the range resistor.
- Range switch: 1.5 kΩ (as loaded) or 15 kΩ from the − input to the cell's − pole.
- The resistor under test sits in the feedback path, from the − input to the output. A second switch picks a fixed "mystery" resistor (3.3 kΩ, as loaded) or a 47 kΩ rheostat.
- A moving-coil meter (6 V full scale, 1 mA movement) from the output to ground.

## Observable behaviour
- The op-amp holds its − input at ground, so the range resistor always carries exactly the cell voltage divided by its value: 1 mA on the 1.5 kΩ range, 0.1 mA on the 15 kΩ range.
- None of that current can enter the op-amp input; all of it comes through the resistor under test, so the output stands at that current times Rx: 1 V per kΩ, or 1 V per 10 kΩ.
- Mystery resistor: the meter reads 3.30 on the first range, 0.33 on the second.
- Rheostat: zero resistance reads 0; 2.35 kΩ reads 2.35; 4.7 kΩ reads 4.70. Equal steps of resistance, equal steps on the scale.
- Over range (23.5 kΩ on the first range): the output runs into its ceiling and the needle pins past full scale. On the second range the same resistor reads 2.35, the whole 47 kΩ 4.70.

## What this verifies
1. Feedback forces a known, constant current through the unknown resistor.
2. Then the voltage across it is proportional to the resistance: a linear ohm scale, unlike the crowded scale of an ordinary ohmmeter.

```assert
# mystery 3.3 kΩ on the 1 kΩ/V range: 1 mA through it, 3.30 V out
net lm324_5.1_neg V 0.000 +-0.002
net vsource_4.neg V -1.50 +-0.01
net lm324_5.1_out V 3.30 +-0.02
```

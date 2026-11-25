# lab-opamp-ammeter — expected behaviour

## Circuit
- The circuit under test: a 4.5 V battery (`vsource_4`) driving 47 Ω; its current returns to ground through a 1 Ω sensing resistor (`resistor_6`).
- 9 V, one LM324 (`lm324_12`); sections 2 to 4 are parked. Section 1 is a non-inverting amplifier: 1 kΩ to ground, and 39 kΩ plus a 22 kΩ "calibrate" rheostat back (gain about 40 to 62; as loaded about 50).
- The slide switch (`slide_switch_11`) feeds its + input from the top of the sensing resistor ("measure", as loaded) or from the calibration voltage: a red LED fed from 9 V through 2.2 kΩ, divided by 18 kΩ / 1 kΩ.
- The meter (6 V full scale) on the output is read as twenty milliamps per volt. A silicon diode across it would carry any reverse drive past it.

## Observable behaviour
- The load draws about 94 mA, which leaves 94 mV across the sensing resistor: far too little to disturb the circuit, and the op-amp scales it up.
- Calibrating: switch to the calibration voltage. The LED holds its own voltage (about 1.65 V here) almost regardless of the battery, and the divider takes about a nineteenth of it: 87 mV, which should read like 87 mA, that is 4.34 on the meter. Turn the calibrate knob until it does (as loaded it is already there).
- Back on "measure": about 4.69 on the meter, which at twenty milliamps per volt is 94 mA, agreeing with the current that actually flows.
- With the battery under test reversed the input goes slightly negative; this single-supply op-amp's output stops at ground and the needle rests at zero instead of being driven backwards.

## What this verifies
1. A current is measured as the small voltage it drops across a known low resistance.
2. An amplifier lets that resistance be small enough not to disturb the circuit.
3. A meter can be calibrated with a known small voltage instead of a known large current.

```assert
# measuring: 94 mA gives 94 mV on 1 Ω, x50 on the meter; the LED-derived
# calibration voltage
net resistor_6.a V 0.0938 +-0.0005
net lm324_12.1_out V 4.69 +-0.03
net resistor_10.a V 0.0867 +-0.002
```

# lab-steady-hand — expected behaviour

## Circuit
The wire-loop game, built around a 555 monostable on 9 V. The bent wire and the loop are one contact, drawn as the WIRE button: touching the wire with the loop pulls TRIGGER from its 10 kΩ pull-up to ground. R_t = 100 kΩ from +9 V and C_t = 10 µF to ground set the time; DISCHARGE and THRESHOLD are joined at C_t. CONTROL is decoupled with 10 nF and RESET is tied to +9 V. The output drives a buzzer and a red LED (1 kΩ) to ground; a green LED (1 kΩ) from +9 V to the output is lit while the output is low.

## Observable behaviour
- **Ready:** after power-up the output stays low (about 0.23 V): green on, red and buzzer off. The timing capacitor stays empty.
- **A touch:** even a 30 ms brush of the WIRE contact starts the timer. The output goes high, the buzzer sounds and the red LED lights; green goes out.
- **Stretched to a fixed length:** the alarm lasts t = 1.1 × R_t × C_t = 1.1 × 100 kΩ × 10 µF = 1.1 s, however short the touch was. C_t charges to two thirds of 9 V (6 V), then the 555 ends the pulse and empties the capacitor.
- **Then ready again** for the next touch.

## What this verifies
1. A monostable turns a brief, messy contact into one clean pulse of fixed length.
2. The pulse length is 1.1 · R · C and does not depend on how long the trigger lasted.

```assert
pulse_duration_ms: 1100 ± 10%
net timer.trigger V 9.00 +-0.01
net timer.output V 0.23 +-0.10
```

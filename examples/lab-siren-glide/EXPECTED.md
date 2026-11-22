# lab-siren-glide — expected behaviour

## Circuit
A 555 astable on 9 V whose timing network is not fed from the supply but from a slowly moving "glide" voltage. Pressing SIREN charges C_glide = 100 µF from +9 V through R_charge = 2.2 kΩ; R_bleed = 47 kΩ drains it all the time. From the glide node, R1 = 10 kΩ runs to DISCHARGE and R2 = 10 kΩ on to THRESHOLD/TRIGGER, with C = 47 nF to ground. The 555 itself (VCC, RESET) sits on the steady +9 V. The output drives a piezo; CONTROL is decoupled with 10 nF.

## Observable behaviour
The 555 switches when its timing capacitor reaches two thirds of 9 V, that is 6 V. The capacitor charges towards the glide voltage, so the glide voltage decides everything:

- **Glide below about 6 V:** the capacitor can never reach 6 V. No oscillation, silence.
- **Glide just above 6 V:** the capacitor creeps up to 6 V very slowly: a low note.
- **Glide well above 6 V:** it gets there quickly: a higher note.

Holding SIREN from rest, then releasing it after 1.5 s:

| Time after pressing | glide voltage | pitch |
|---|---|---|
| 0.1 s | 3.3 V | silent |
| 0.3 s | 6.5 V | about 550 Hz |
| 0.5 s | 7.5 V | about 730 Hz |
| 1.0 s and on | 7.9 V | about 790 Hz (top) |
| released, +0.2 s | 7.0 V | about 560 Hz |
| released, +0.4 s | 6.4 V | about 350 Hz |
| released, +0.6 s | 5.9 V | silent again |

- **Rise and fall:** the note swoops up in about half a second, holds while SIREN is held, then sinks and dies away once the button is released.
- **The top is below 9 V** because R_bleed and the timing resistors keep drawing current from C_glide while R_charge feeds it.
- **Slower sweep:** a bigger C_glide or bigger R_charge and R_bleed make both the rise and the fall slower.

## What this verifies
1. An oscillator's frequency can be controlled by a voltage: a simple voltage-controlled oscillator.
2. An RC network shapes how that control voltage rises and falls (an envelope).

```assert
# SIREN not pressed: glide node empty, no tone
net c_glide.a V 0.00 +-0.01
net timer.vcc V 9.00 +-0.01
```

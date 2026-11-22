# lab-555-vco — expected behaviour

## Circuit
A 555 astable on 9 V (R1 = 1 kΩ from +9 V to DISCHARGE, R2 = 10 kΩ from DISCHARGE to THRESHOLD/TRIGGER, C = 47 nF to ground) whose CONTROL pin is driven from outside. The TUNE pot (10 kΩ between +9 V and ground) feeds CONTROL through R_ctl = 1 kΩ. The BIT button adds R_shift = 4.7 kΩ from CONTROL to ground. A voltmeter reads CONTROL; the output drives a piezo. RESET is tied to +9 V.

## Observable behaviour
CONTROL is the upper switching threshold of the 555 (normally two thirds of the supply), and the lower threshold is always half of it. The timing capacitor swings between those two voltages, so moving CONTROL changes the frequency:

| TUNE position | CONTROL | frequency (simulation) |
|---|---|---|
| 0 % | 1.39 V | about 2290 Hz |
| 25 % | 3.99 V | about 1940 Hz |
| 50 % | 5.27 V | about 1610 Hz |
| 60 % (start) | 5.70 V | about 1510 Hz |
| 75 % | 6.40 V | about 1325 Hz |
| 100 % | 8.31 V | about 740 Hz |

- **Higher control voltage, lower pitch:** a higher threshold means the capacitor has further to climb, and it climbs ever more slowly as it nears the supply.
- **CONTROL never reaches the pot's ends:** the 555's internal 5 kΩ divider pulls on the pin, so at TUNE 0 % it still sits at 1.39 V and at 100 % only at 8.31 V.
- **FSK:** at TUNE 60 %, pressing BIT drops CONTROL from 5.70 V to 4.20 V and the tone jumps from about 1510 Hz to about 1890 Hz. Releasing it jumps back. Two tones for 0 and 1 is how early modems sent data.
- **The duty cycle moves too:** from about 11 % high at TUNE 0 % to 75 % at 100 %, because only the charging (high) time depends on the threshold.

## What this verifies
1. A 555's frequency can be set by a voltage on CONTROL: a voltage-controlled oscillator (VCO).
2. Switching that voltage between two values sends binary data as two tones (frequency-shift keying).

```assert
# TUNE at 60 %, BIT released
net timer.control V 5.70 +-0.05
```

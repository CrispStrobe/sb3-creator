# 51-555-astable -- expected behaviour

## Circuit

Classic 555 timer in astable (free-running) mode.

- VCC (5 V) powers the 555 timer
- R1 (10 kOhm) from VCC to discharge pin
- R2 (10 kOhm) from discharge pin to threshold/trigger pins
- C1 (10 uF) from threshold/trigger to GND
- Reset pin tied to VCC (always enabled)
- Output drives an LED through a 1 kOhm current-limiting resistor

This is the first example of a blinking LED with no MCU and no program --
the 555 timer generates the oscillation purely in hardware.

## Timing calculations

- **t_high (charge through R1 + R2):** 0.693 x (R1 + R2) x C = 0.693 x 20000 x 0.00001 = 138.6 ms
- **t_low (discharge through R2):** 0.693 x R2 x C = 0.693 x 10000 x 0.00001 = 69.3 ms
- **Period:** t_high + t_low = 138.6 + 69.3 = 207.9 ms
- **Frequency:** 1 / 0.2079 = 4.81 Hz (approximately 4.8 Hz)
- **Duty cycle:** t_high / period = 138.6 / 207.9 = 66.7% (approximately 67%)

## Observable behaviour

- **LED blinks** at approximately 4.8 Hz (about 5 times per second)
- **LED is ON** for about 139 ms, **OFF** for about 69 ms
- **LED current when ON:** (5.0 - 2.0) / 1000 = 3.0 mA (from 555 output high)
- The duty cycle is always > 50% in standard astable mode because
  charging goes through R1 + R2 but discharging only through R2

## What this verifies

1. The 555 timer generates a clock signal without any microcontroller
2. Astable frequency formula: f = 1 / (0.693 x (R1 + 2 x R2) x C)
3. Duty cycle is set by the R1/R2 ratio
4. The 555 output can directly drive an LED through a resistor
5. Hardware oscillators predate and complement MCU-based timing

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```

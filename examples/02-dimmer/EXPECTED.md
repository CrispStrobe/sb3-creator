# 02-dimmer — expected behaviour

## Circuit

- VCC (5 V) → 10 kΩ pot → GND. Wiper → MCU P1.3 (ADC channel 3).
- VCC → 1 kΩ resistor → red LED (Vf = 2.0 V) → MCU P1.0 (active-low).

## Program

Reads the pot via ADC (10-bit, 0–1023), uses the LSB to toggle the LED at
~1 kHz. At 50% pot position, the ADC reads ~512, so the LED toggles based
on bit 0 of the reading.

## Observable behaviour

| pot position | ADC reading | P1.3 voltage | LED behaviour |
|---|---|---|---|
| 0% (fully CCW) | ~0 | ~0 V | bit 0 = 0 → LED off |
| 50% | ~512 | ~2.5 V | bit 0 = 0 → LED off |
| 51% | ~520 | ~2.54 V | bit 0 = 0 → LED off |
| 100% (fully CW) | ~1023 | ~5.0 V | bit 0 = 1 → LED on |

Note: this is a simplified dimmer using bit masking. A real PWM dimmer
would use Timer 1 or the PCA. This example exercises the ADC read path
and the `set pin to expression` construct.

## What this verifies

1. ADC reads the pot voltage on P1.3 (channel 3) as a 10-bit value
2. `set led1 to level bitand 1` writes a computed value to an active-low pin
3. The analog → digital → pin-write path works end to end

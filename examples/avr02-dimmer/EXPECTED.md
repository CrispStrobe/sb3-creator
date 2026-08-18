# avr02-dimmer — expected behaviour

## Circuit

10 kΩ potentiometer: CW → VCC (5 V), CCW → GND, wiper → A0.
MCU D9 → white LED (Vf = 3.0 V) → 220 Ω → GND.

## Program

Reads A0 (10-bit ADC, 0–1023), scales to 0–100%, sets D9 PWM brightness.
50 ms loop = 20 Hz update rate, fast enough for smooth dimming.

## Observable behaviour

| pot position | A0 reading | brightness | D9 PWM duty | LED current (peak) |
|---|---|---|---|---|
| full CCW (0 V) | 0 | 0% | 0% | 0 mA |
| mid (2.5 V) | 512 | ~50% | ~50% | (5.0 − 3.0) / 220 = 9.1 mA |
| full CW (5 V) | 1023 | 100% | 100% | 9.1 mA |

- **ADC resolution:** 10-bit (0–1023), ~4.88 mV per step
- **PWM frequency on D9:** Timer1, ~490 Hz (8-bit fast PWM)
- **Brightness is linear in duty cycle**, not in perceived luminance

## What this verifies

1. ADC read on A0 returns 0–1023 via ADMUX channel selection + ADCSRA conversion
2. PWM output on D9 (OC1A) sets duty cycle proportional to the reading
3. The cooperative scheduler samples at 20 Hz without blocking
4. Analog input and PWM output work together on the AVR path

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```

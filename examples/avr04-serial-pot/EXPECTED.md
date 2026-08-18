# avr04-serial-pot — expected behaviour

## Circuit

10 kΩ potentiometer: CW → VCC (5 V), CCW → GND, wiper → A0.
No external LEDs — this example exercises the serial output path.

## Program

Reads A0 every 500 ms and prints the value over USART0 (serial monitor).
This is the simplest program that exercises the `print` statement on AVR.

## Observable behaviour

| pot position | A0 reading | serial output |
|---|---|---|
| full CCW (0 V) | 0 | `0` |
| mid (2.5 V) | 512 | `512` |
| full CW (5 V) | 1023 | `1023` |

- **Serial baud:** 9600 (default, via USART0 — UBRR0 computed from F_CPU)
- **Output rate:** one reading every 500 ms (2 Hz)
- **Output format:** decimal integer followed by newline

## What this verifies

1. ADC read on A0 (channel 0) via ADMUX + ADCSRA
2. USART0 transmit (the `print` block) — UBRR0 = F_CPU/16/baud − 1 = 103
3. The `adapter.onSerial` hook receives the characters
4. Proven live: "512 @ 2.5V over the new adapter onSerial hook" (bw-board e715cf9)

## Difference from STC12 serial

The STC12 uses its built-in UART at whatever baud Timer 1 computes from FOSC.
The ATmega328P uses USART0 with a baud rate register derived from F_CPU.
The program is identical; the generated C and the register setup differ.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```

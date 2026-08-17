# pico04-button -- expected behaviour

## Circuit

Button between VCC (3.3 V) and GP3, with a 10 k pull-down resistor to GND.
GP15 drives a green LED (Vf = 2.1 V) through a 220 R current-limiting resistor.

Active-high: pressing the button pulls GP3 to 3.3 V; releasing lets the
pull-down hold it at GND.

## Program

Reads GP3 in a tight loop. When the button is pressed (GP3 = HIGH),
GP15 goes HIGH and the LED turns on. When released, GP15 goes LOW.

## Observable behaviour

| button state | GP3 level | GP15 level | LED state | LED current |
|---|---|---|---|---|
| released | low (0 V) | low (0 V) | OFF | 0 mA |
| pressed | high (3.3 V) | high (3.3 V) | ON | (3.3 - 2.1) / 220 = 5.5 mA |

## What this verifies

1. `PIN btn = GP3 INPUT` parses and generates correct SIO input setup
2. Pad IE + Schmitt trigger enabled for the input pin (50d867e)
3. `read btn` reads the SIO GPIO_IN register, bit 3
4. `IF read btn THEN` drives conditional output
5. Single-task tight loop (no waits, no scheduler)
6. Full chain: generateC -> arm-none-eabi-gcc (rp2040) -> binary

## Why GP3 and GP15

GP3 is a general-purpose digital pin with no ADC function, making it a
clear digital-input example. GP15 is far enough from GP3 to show that
pin assignments are independent. Neither conflicts with UART0 (GP0/GP1)
used for serial output.

```assert
# Pico supply: VCC = 3.300V (3.3V rail, not 5V)
net vcc1.vcc V 3.30 +-0.01
```

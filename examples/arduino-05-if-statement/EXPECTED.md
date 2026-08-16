# arduino-05-if-statement — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (VCC to GND). D13 → 220 ohm → red LED → GND.

## Program

Reads pot on A0 and compares to threshold (400). If above threshold, LED on; below, LED off. Prints the analog value to serial.

## Observable behaviour

- **Pot below ~40 % (ADC < 400):** LED on D13 is **OFF**.
- **Pot above ~40 % (ADC > 400):** LED on D13 is **ON**.
- Serial monitor shows the raw ADC value updating every 50 ms.
- There is a sharp on/off transition at the threshold — no dimming.

## What this verifies

1. Conditional: `if analogValue > threshold then: turn on led`
2. Threshold-based digital output from an analog input
3. Serial monitoring of the sensor value alongside LED control

# arduino-06-ping — expected behaviour

## Circuit

Arduino Uno D7 drives TRIG and D8 reads ECHO. The HC-SR04 uses a 5 V supply. Retargeted benches use the GPIO pins in their PART declaration. The Pico and STM32F030 benches divide ECHO down to their logic level with 1 kΩ over 1.8 kΩ.

## Program

Sends a 10 µs trigger pulse, then measures the ECHO pulse on the input pin. ECHO stays high for 58 µs per centimetre. Prints whole centimetres every 100 ms and reports 999 if there is no echo within the measurement window.

## Observable behaviour

- **Serial monitor** prints distance readings every 100 ms.
- The ultrasonic sensor returns a value proportional to distance.
- In simulation, the distance control changes the width of the wired echo pulse.

## What this verifies

1. TRIG is high for 10 µs.
2. ECHO reaches the MCU input for 2,320 µs at 40 cm and 6,960 µs at 120 cm.
3. Serial output reports 40 cm and 120 cm respectively.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```

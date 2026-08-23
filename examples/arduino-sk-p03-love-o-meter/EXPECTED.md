# arduino-sk-p03-love-o-meter — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot (simulating TMP36 sensor, VCC to GND). D2, D3, D4 → three LEDs → GND.

## Program

Reads A0 and converts it to a temperature in whole degrees C with one integer
expression, `((sensorVal * 500) / 1024) - 50`. Lights 0-3 LEDs on thresholds
relative to a 20 C baseline.

That single expression replaces the two floating-point ones the port started
with. `sensorVal * (5.0 / 1024)` emitted `sensorVal * (5 / 1024)` in C, which is
sensorVal * 0, and the 0.5 offset in `(voltage - 0.5) * 100` was truncated to 0
as well — the emitter renders every numeric literal as an integer. The
temperature was 0 at every reading and the bargraph never lit. Algebraically
`(v - 0.5) * 100` with `v = sensorVal * 5 / 1024` IS `sensorVal * 500 / 1024 - 50`,
so the meaning is unchanged and both targets now agree.

The pot stands in for a TMP36, which only swings 0.5-1.75 V, so the whole
bargraph lives in a narrow band of pot travel: 20 C is ADC 143, 22 C is 147 and
24 C is 152. Turn the pot slowly near the bottom of its range.

## Observable behaviour

- **Pot low (cold, < 20 C):** all three LEDs **OFF**. Serial prints low temperature.
- **Pot ~20-22 C range:** LED 1 (D2) turns **ON**.
- **Pot ~22-24 C range:** LEDs 1 and 2 (D2, D3) **ON**.
- **Pot > 24 C:** all three LEDs **ON** — full bar.
- Serial monitor shows the computed temperature value.

## What this verifies

1. ADC -> temperature conversion, integer-safe (multiply before divide)
2. Threshold-based bargraph: each LED lights at a progressively higher temperature
3. Simulated analog sensor via potentiometer

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```

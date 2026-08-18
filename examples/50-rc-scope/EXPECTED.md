# 50-rc-scope -- expected behaviour

## Circuit

Function generator (100 Hz sine, 2.5 V amplitude, 2.5 V offset) ->
10 kOhm resistor -> 1 uF capacitor -> GND.

This is the classic first-order RC low-pass filter.

## Filter parameters

- **R:** 10 kOhm
- **C:** 1 uF
- **Time constant (tau):** R x C = 10000 x 0.000001 = 0.01 s = 10 ms
- **Cutoff frequency (fc):** 1 / (2 x pi x R x C) = 15.9 Hz
- **Input frequency:** 100 Hz

## Observable behaviour

The input is at 100 Hz, well above the cutoff of 15.9 Hz (ratio f/fc = 6.3).

- **Attenuation at 100 Hz:** 1 / sqrt(1 + (f/fc)^2) = 1 / sqrt(1 + 39.5) = 0.157 (-16.1 dB)
- **Input V_pp:** 5.0 V (swings 0 V to 5 V)
- **Output V_pp (across capacitor):** approximately 5.0 x 0.157 = 0.78 V
- **Output DC level:** 2.5 V (the offset passes through)
- **Phase lag:** arctan(f/fc) = arctan(6.3) = approximately 81 degrees

### Scope view

- **Channel 1 (input):** clean sine, 0 V to 5 V, period = 10 ms
- **Channel 2 (across capacitor):** a smaller, rounded sine centered on 2.5 V
  with roughly 0.78 V peak-to-peak, lagging the input by about 81 degrees

## What this verifies

1. RC low-pass filter attenuates signals above the cutoff frequency
2. The cutoff frequency fc = 1 / (2 x pi x R x C)
3. Phase shift increases with frequency
4. DC offset passes through the filter unaffected
5. The scope reveals the difference between input and output waveforms

```assert
# Function generator DC offset (5Vpp sine midpoint at t=1ms)
net fg1.vcc V 2.50 +-2.60
```

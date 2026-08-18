# 49-function-generator-sine -- expected behaviour

## Circuit

A voltage source configured as a function generator outputs a 1 kHz sine wave
with 2.5 V amplitude and 2.5 V DC offset, driving a 1 kOhm load resistor.
No LED -- this example is about observing waveforms.

## Function generator settings

- **Waveform:** sine
- **Frequency:** 1000 Hz (1 kHz)
- **Amplitude:** 2.5 V (peak deviation from offset)
- **Offset:** 2.5 V (DC bias)

## Observable behaviour

- **V_peak:** offset + amplitude = 2.5 + 2.5 = 5.0 V
- **V_valley:** offset - amplitude = 2.5 - 2.5 = 0.0 V
- **V_peak-to-peak:** 5.0 V
- **Frequency:** 1 kHz
- **Period:** 1 / 1000 = 1.0 ms
- **Current through load (peak):** 5.0 V / 1000 = 5.0 mA
- **Current through load (valley):** 0.0 V / 1000 = 0.0 mA
- **Scope view:** a full sine wave swinging between 0 V and 5 V,
  completing one cycle every 1 ms

## What this verifies

1. The vsource part can be configured as a function generator
2. Sine wave parameters: amplitude, offset, frequency
3. The relationship between period and frequency (T = 1/f)
4. Voltage across a resistive load follows the source waveform exactly

```assert
# Function generator DC offset (5Vpp sine midpoint)
net fg1.vcc V 2.50 +-2.60
```

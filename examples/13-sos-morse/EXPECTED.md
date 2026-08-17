# 13-sos-morse -- expected behaviour

## Circuit

VCC (5 V) -> 470 Ohm resistor -> red LED (Vf = 2.0 V) -> MCU P1.0 (active-low).

## Program

Blinks SOS in Morse code, repeating forever.
Timing unit = 0.2 s. Dot = 1 unit on. Dash = 3 units on. Element gap = 1 unit off.
Letter gap = 3 units off. Word gap = 7 units off.

## Observable behaviour

| phase       | pattern            | duration  |
|-------------|--------------------|-----------|
| S (3 dots)  | on 0.2s off 0.2s x3 | 1.2 s    |
| letter gap  | off                | 0.4 s     |
| O (3 dashes)| on 0.6s off 0.2s x3 | 2.4 s    |
| letter gap  | off                | 0.4 s     |
| S (3 dots)  | on 0.2s off 0.2s x3 | 1.2 s    |
| word gap    | off                | 1.0 s     |
| **total**   |                    | **6.6 s** |

- **LED current (when on):** (5.0 - 2.0) / 470 = 6.4 mA
- **Cycle period:** 6.6 seconds per SOS sequence
- **Duty cycle:** approximately 36% (2.4 s on out of 6.6 s)
- **Voltage across resistor (when on):** 6.4 mA x 470 = 3.0 V

## What this verifies

1. REPEAT N construct for counted loops
2. Nested timing sequences with varying on/off durations
3. Multiple sequential REPEAT blocks in one FOREVER loop

```assert
# MCU supply: VCC = 5.000V
net MCU.VCC V 5.00 +-0.01
```

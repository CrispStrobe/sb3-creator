# 17-comparator -- expected behaviour

## Circuit

Pot A (10 kOhm, position 30%) wiper -> MCU P1.6 (ADC).
Pot B (10 kOhm, position 70%) wiper -> MCU P1.7 (ADC).
Indicator: VCC -> 1 kOhm -> red LED (Vf = 2.0 V) -> MCU P1.0 (active-low).

## Program

Compares two ADC readings. LED on when pot A reading exceeds pot B reading.

## Observable behaviour (default positions)

| pot A pos | pot B pos | V_A   | V_B   | ADC_A | ADC_B | LED |
|-----------|-----------|-------|-------|-------|-------|-----|
| 30%       | 70%       | 1.50 V| 3.50 V| 307   | 717   | OFF |
| 50%       | 50%       | 2.50 V| 2.50 V| 512   | 512   | OFF |
| 80%       | 40%       | 4.00 V| 2.00 V| 819   | 410   | ON  |

- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Pot current (each):** 5.0 / 10000 = 0.5 mA
- **Sampling rate:** 10 Hz
- **Crossover point:** LED turns on when A% > B%

## What this verifies

1. Two independent ADC channels read simultaneously
2. Comparison of analog values to drive digital output
3. Software comparator behaviour (mimics hardware LM339)

```assert
# Both pots at 50%: potA = potB = 2.500V (equal → LED off)
net POT_potA.wiper V 2.50 +-0.05
net POT_potB.wiper V 2.50 +-0.05
```

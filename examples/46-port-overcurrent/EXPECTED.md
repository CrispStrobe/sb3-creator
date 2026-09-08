# 46-port-overcurrent — the aggregate current lesson

## Circuit

8 LEDs on Port 1 (P1.0–P1.7), all active-low with 160 Ω resistors.
VCC → 160 Ω → LED → MCU pin, for each of the 8 pins.
This is deliberately an STC12C5A60S2-only lesson: its aggregate Port 1
sink-current limit is the subject, so retargeting it to unrelated GPIO ports
or source-driven LED conventions would teach a different electrical claim.

## The lesson

Ideal resistor arithmetic gives (5.0 − 2.0) / 160 = 18.75 mA per pin,
below the 20 mA per-pin maximum. The engine also models the pin's output
resistance, producing a slightly lower current per branch, but the sum of all
eight branches is still greater than the chip's approximately 120 mA I/O
budget (STC12C5A60S2 datasheet §4.6).

An absolute-maximum violation is a design error even if a simulator continues
to solve the circuit. On hardware it can cause voltage sag, resets, overheating,
or permanent damage. Use larger resistors or an external driver.

## STC12C5A60S2 current limits (datasheet §4.6)

| limit | value | notes |
|---|---|---|
| Per-pin sink (quasi-bidirectional) | 20 mA | any mode |
| Per-pin source (quasi-bidirectional) | ~230 µA | weak pull-up |
| Per-pin source (push-pull) | 20 mA | strong pull-up |
| **Total chip I/O current** | **~120 mA** | all ports combined |

## Observable behaviour

| all 8 on | per-LED current | total Port 1 | % of chip budget |
|---|---|---|---|
| 160 Ω | below 20 mA | above 120 mA total | over 100% |

All 8 LEDs light simultaneously. The model-backed gate checks the actual
branch currents: each stays below 20 mA and their sum exceeds 120 mA.

## What this verifies

1. 8 LEDs on one port all light (individually within spec)
2. The aggregate current exceeds the chip budget while every branch remains below its pin limit
3. **No circuit-time DRC warning exists yet** (as of 2026-08-10). `cToPseudocode`
   warns on pin declarations when reading C; the circuit designer does not warn.
   `bw-board` owns the DRC path; this example is the fixture for when it ships.
4. The example teaches the aggregate limit alongside the per-pin limit

```assert
# MCU supply: VCC = 5.000V (8 LEDs on one port)
net mcu1.VCC V 5.00 +-0.01
```

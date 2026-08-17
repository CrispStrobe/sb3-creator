# 06-active-low-high — expected behaviour

## Circuit

Two LEDs, two wirings on one board:

- **Active-low (red):** VCC → 1 kΩ → LED → MCU P1.0.
  `turn on` drives P1.0 LOW (0), current flows VCC→R→LED→pin.
- **Active-high (green):** MCU P1.1 → 1 kΩ → LED → GND.
  `turn on` drives P1.1 HIGH (1), current flows pin→R→LED→GND.

## Program

Both LEDs blink together at 1 Hz. `turn on` means "turn on" regardless
of wiring — the polarity flag handles the inversion.

## Observable behaviour

| time | P1.0 (active-low) | P1.1 (active-high) | red LED | green LED |
|---|---|---|---|---|
| 0 ms | LOW (0) | HIGH (1) | ON | ON |
| 500 ms | HIGH (1) | LOW (0) | OFF | OFF |
| 1000 ms | LOW (0) | HIGH (1) | ON | ON |

- Both LEDs have the same current: (5.0 − 2.0) / 1000 = 3.0 mA
- Both appear to blink in sync despite opposite pin levels

## What this verifies

1. `turn on` on ACTIVE LOW drives the pin LOW
2. `turn on` on a normal (active-high) pin drives the pin HIGH
3. The polarity abstraction: same pseudocode, different wiring, same result
4. The quasi-bidirectional 8051 pin can sink (active-low) and source (active-high)

```assert
# MCU supply: VCC = 5.000V
net mcu1.VCC V 5.00 +-0.01
```

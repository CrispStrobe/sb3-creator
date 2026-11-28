# pc86-led-sanduhr — expected behaviour

## Circuit
555 astable (R₁=10 kΩ, R₂=68 kΩ, C=10 µF) → f ≈ 0.99 Hz. The CD4017 feeds six yellow LEDs through a diode matrix and individual 1 kΩ resistors. Q0 leaves them dark. Q1 through Q6 each feed one more LED. Q7 and the level sensor reach RESET through separate diodes and share a 100 kΩ pull-down.

## Observable behaviour
- **Running:** LEDs fill one per second as Q1 through Q6 become active.
- **After 6 s:** all 6 LEDs lit. Counter wraps, starts over.
- **Returned to level:** RESET holds Q0 and all LEDs are dark. Tilting again releases RESET and restarts the fill.
- Each active LED draws a few milliamps. The diode matrix keeps inactive outputs isolated.

## What this verifies
1. Accumulating fill pattern even though only one counter output is high
2. Tilt sensor as physical reset trigger
3. 555 ~1 Hz clock for "sand grain" timing

```assert
# 555+CD4017 hourglass: f ~ 0.99Hz, 6 LEDs fill then wrap
net vcc_1.pos V 5.00 +-0.01
```

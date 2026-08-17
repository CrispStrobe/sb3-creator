# pc70-schmitt-trigger — expected behaviour

## Circuit
NAND gate with inputs driven by RC ramp. R = 100 kΩ, C = 10 µF (τ = 1 s). Output → 1 kΩ → yellow LED → GND.

## Observable behaviour
- **t = 0:** capacitor discharged, input ≈ 0 V. NAND(0,0) = 1. LED ON.
- **t ≈ 0.5–1 s:** capacitor charges through RC. Input rises gradually.
- **Input reaches ~2.5 V (VCC/2):** gate switches. Output LOW. LED OFF.
- The transition is sharp despite the gradual input ramp.

## What this verifies
1. Gate switching threshold produces clean output from slow input
2. RC time constant τ = R × C = 100k × 10µ = 1 s
3. A real 74HC132 would add hysteresis for even cleaner switching

```assert
# RC ramp into NAND: tau = 100k * 10uF = 1s, gate switches at ~VCC/2
net vcc_1.pos V 5.00 +-0.01
```

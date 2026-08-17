# pc08-diode-polarity

## Circuit
5V → 220Ω → forward diode (Vf=0.7V) → LED → return.

## Expected
- Forward: I = (5.0 - 0.7 - 2.0) / 220 ≈ 10.5 mA — LED lights
- Reverse: no current — LED dark

```assert
# Forward: 5V - 0.7V(diode) - 2.0V(LED) across 220R
net vsource_2.pos V 5.00 +-0.01
```

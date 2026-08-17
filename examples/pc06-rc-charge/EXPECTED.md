# pc06-rc-charge

## Circuit
5V → 10kΩ → 100µF capacitor → return. τ = RC = 1.0 s.

## Expected
- Time constant τ = 10000 × 0.0001 = 1.0 s
- At t = τ: Vc ≈ 3.16V (63.2% of 5V)
- At t = 5τ: Vc ≈ 4.97V (99.3%)

```assert
# RC charge: tau = 10k * 100uF = 1.0s, Vc(steady) = 5V
net vsource_2.pos V 5.00 +-0.01
```

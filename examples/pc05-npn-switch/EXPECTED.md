# pc05-npn-switch

## Circuit
NPN transistor switches an LED. Base driven through 10kΩ from supply.
Collector: 470Ω → LED → supply. Emitter: ground.

## Expected
- Ib = (5.0 - 0.7) / 10000 = 0.43 mA
- Ic (saturated) = (5.0 - 2.0 - 0.2) / 470 ≈ 5.96 mA

```assert
# NPN saturated: Vbe=0.7V, Vce_sat=0.2V, LED on
net vsource_2.pos V 5.00 +-0.01
net npn_5.base V 0.70 +-0.10
net npn_5.collector V 0.20 +-0.15
```

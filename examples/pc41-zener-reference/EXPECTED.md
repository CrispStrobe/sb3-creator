# Zener reference

The series resistor limits current from the source. Once the zener reaches its
breakdown region, the reference node remains near its specified clamp voltage.

```assert
# Zener reference: Vz ≈ 5.1V breakdown voltage
net r1.b V 5.12 +-0.20
```

# Diode clamp

The source reaches the output through a resistor. The diode begins conducting
when the node is driven beyond its forward threshold, limiting the excursion
and protecting the load.

```assert
# Diode clamp: forward-biased diode clamps at Vf ≈ 0.7V (Shockley)
net r.b V 0.74 +-0.10
```

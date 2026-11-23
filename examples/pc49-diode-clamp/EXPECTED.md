# Diode clamp

The source reaches the output through a resistor. The diode begins conducting
when the node is driven beyond its forward threshold, limiting the excursion
and protecting the load.

```assert
# Diode clamp: the forward-biased diode clamps the node at its Shockley drop,
# 0.62 V at the 4.3 mA it takes here
net r.b V 0.62 +-0.10
```

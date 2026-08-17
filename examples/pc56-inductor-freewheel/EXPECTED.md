# Inductor freewheel

The switch energizes the inductor. When it opens, the inductor current continues
through the diode and load path instead of forcing an abrupt open circuit.

```assert
# Inductor freewheel: supply 9V, steady state through 100R + inductor
net src.pos V 9.00 +-0.01
```

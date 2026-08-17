# LDR comparator

The LDR divider supplies a changing input while the fixed divider supplies a
reference. The op-amp output changes state as the light control crosses it.

```assert
# LDR comparator: reference = VCC/2 = 2.5V at rr1/rr2 junction
net src.pos V 5.00 +-0.01
```

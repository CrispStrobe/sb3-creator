# NTC indicator

The thermistor is in series with the LED branch. Lower resistance produces more
current and a brighter indicator; higher resistance produces less current.

```assert
# NTC in series with R and the LED: at 25 °C only 35 uA flow, so the LED sits
# low on its curve (1.50 V) and the NTC/R junction reads 1.54 V
net ntc.b V 1.54 +-0.20
```

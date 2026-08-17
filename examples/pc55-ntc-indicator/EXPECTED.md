# NTC indicator

The thermistor is in series with the LED branch. Lower resistance produces more
current and a brighter indicator; higher resistance produces less current.

```assert
# NTC divider: at 25°C NTC ≈ R, junction ≈ VCC × R/(NTC+R) ≈ 2.03V
net ntc.b V 2.03 +-0.20
```

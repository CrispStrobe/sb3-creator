# Thermistor divider

The NTC and the fixed 10 kΩ resistor form a temperature-sensitive divider. Drag
the NTC's temperature control and the junction moves: as the thermistor gets
hotter its resistance falls, and the junction is pulled towards the supply.

Measured on the engine (board vcc 5, `--at 1`, control = the NTC's temperature
slider from cold to hot):

| control | NTC resistance | junction | check |
|---|---|---|---|
| 0.00 (cold) | 100 kΩ | 0.4545 V | 5 · 10/110 ✓ |
| 0.25 | ~31.6 kΩ | 1.2013 V | |
| 0.50 | 10 kΩ | 2.5000 V | equal halves ✓ |
| 0.75 | ~3.16 kΩ | 3.7987 V | |
| 1.00 (hot) | 1 kΩ | 4.5455 V | 5 · 10/11 ✓ |

The values are exact against the divider formula because nothing loads the
junction. The resistance follows `rCold · (rHot/rCold)^t`, which is why the
midpoint lands on the *geometric* mean of 1 kΩ and 100 kΩ — 10 kΩ — and gives
exactly half the supply.

```assert
# NTC divider at default (cold): 5 * 10k/(100k+10k) = 0.45V
net src.pos V 5.00 +-0.01
net r1.a V 0.45 +-0.10
```

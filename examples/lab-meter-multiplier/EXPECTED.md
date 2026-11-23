# lab-meter-multiplier — expected behaviour

## Circuit
- The meter movement is a moving-coil meter with a coil of one kilohm rated for full deflection at a hundred microamps (the meter part set to current mode, 100 µA full scale, no built-in shunt). Its needle shows the coil current; the coil voltage at full scale is 0.1 V.
- Series multipliers turn it into a voltmeter: 49 kΩ makes 50 kΩ in total, so the rated full-scale current flows at 5 V (5 V range); 99 kΩ makes 100 kΩ, 10 V full scale (10 V range). The slide switch picks one.
- The meter measures the middle of a 10 kΩ / 10 kΩ divider across 9 V. Without any meter that point is at 4.5 V. A high-resistance reference voltmeter shows what the point really does.

## Observable behaviour

On the 5 V range (the authored state) the reference voltmeter shows 4.089 V at the mid-point, the coil carries 81.8 µA and the needle stands at 82 % of 5 V, a reading of 4.09 V. Switch to the 10 V range instead and the mid-point rises to 4.284 V; the coil current falls to 42.8 µA and the needle reads 4.28 V on the 10 V scale.

- On the 5 V range the meter is a 50 kΩ load in parallel with the lower 10 kΩ, which makes 8333 Ω. The mid-point drops to 9 x 8333 / 18333 = 4.091 V instead of 4.5 V.
- On the 10 V range the load is 100 kΩ: 10 kΩ parallel 100 kΩ is 9091 Ω and the mid-point is 9 x 9091 / 19091 = 4.286 V. The higher range disturbs the circuit less, but the needle moves only half as far, so it is harder to read.
- Both readings are correct for the circuit as loaded. The error is not in the meter, it is caused by connecting the meter.

```assert
# 5 V range: the meter's 50 kOhm load pulls the 4.5 V point down;
# range.com is the top of the 1 kOhm coil
net r_up.b V 4.089 +-0.01
net range.com mV 81.8 +-0.5
```

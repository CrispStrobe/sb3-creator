# arduino-03-calibration — expected behaviour

## Circuit

Arduino Uno A0 <- wiper of 10 kohm pot. D9 → 220 ohm → green LED → GND. D13 → 220 ohm → red status LED → GND.

## Program

Phase 1 (5 s): status LED on D13 is ON while sensor min/max are recorded. Phase 2 (run): status LED OFF, each reading is passed through a 4-sample moving average, then mapped from the calibrated range to a 0-100 percent PWM duty on the green LED.

The filter is four `sampleN` variables shifted by hand rather than a list, because the device C emitter has no lists: the list form used in `arduino-03-smoothing` lowers to comments and a constant 0, i.e. a filter present in the simulator and absent on the chip.

## Observable behaviour

- **First 5 seconds:** red status LED on D13 is **ON**. Move the pot through its range to calibrate.
- **After calibration:** status LED turns **OFF**. Green LED on D9 responds to pot:
  - At calibrated minimum -> LED OFF.
  - At calibrated maximum -> LED full brightness.
  - Between -> proportional brightness.

## Filter delay, measured

Calibrated to the full span (sensorMin 0, sensorMax 1023) and stepped from 0 V to 5 V on A0, the duty climbs one quarter of the step per 20 ms pass:

| t after the step | window contents | sensorValue | duty |
| --- | --- | --- | --- |
| 0 ms (last unaffected) | 0, 0, 0, 0 | 0 | 0 % |
| 20 ms | 1023, 0, 0, 0 | 255 | 24 % |
| 40 ms | 1023, 1023, 0, 0 | 511 | 49 % |
| 60 ms | 1023 x 3, 0 | 767 | 74 % |
| 80 ms | 1023 x 4 | 1023 | 100 % |

So the settling time is window x loop period = 4 x 20 ms = **80 ms**, and the group delay of an N-tap boxcar is (N - 1) / 2 = 1.5 samples = **30 ms**. Both are properties of the window and the loop period, not of this particular step.

## What this verifies

1. Auto-calibration: recording min and max over a timed window
2. Constrained mapping: values below min clamp to 0, above max clamp to 100 percent
3. Status LED indicates calibration phase
4. Filter cost: a 4-sample moving average settles in 80 ms and lags by 30 ms

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```

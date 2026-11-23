# lab-exposure-timer — expected behaviour

## Circuit
- 555 monostable at 9 V. The timing capacitor C1 = 22 µF sits on threshold and discharge.
- C1 is charged by a phototransistor (up to half a milliamp in full light) in parallel with R1 = 1 MΩ. R1 alone sets the longest time, in complete darkness.
- Start button pulls the trigger low against a 10 kΩ pull-up. The output lights a white "exposure lamp" LED through 470 Ω.

## Observable behaviour

| light on the sensor | lamp on-time (simulated) | light x time |
|---|---|---|
| full | about 0.27 s | 0.27 |
| half (authored) | about 0.52 s | 0.26 |
| one tenth | about 2.4 s | 0.24 |
| dark | 1.1 x R1 x C1, about 24 s | |

- The phototransistor behaves like a current source: twice the light charges C1 twice as fast to the 555's upper threshold, so the on-time halves. Light multiplied by time, the "dose", stays nearly constant, which is exactly what a darkroom or UV exposure timer needs.
- The dose drifts down a little in dim light because R1's own current then makes up a larger share.
- Idle, the output is low, the discharge pin holds C1 empty and the lamp is off.

```assert
# idle: output low, timing capacitor held empty, trigger pulled up
net u1.output V 0.00 +-0.05
net u1.trigger V 9.00 +-0.02
net u1.control V 6.00 +-0.02
pulse_duration_ms: 24200 +- 2%
```

The `pulse_duration_ms` line is the darkness limit, 1.1 x 1 MΩ x 22 µF.

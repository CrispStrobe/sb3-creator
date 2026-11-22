# lab-colour-pitch — expected behaviour

## Circuit
- 555 astable at 9 V: R1 = 10 kΩ, R2 = 1 kΩ, C1 = 100 nF, control pin decoupled with 10 nF, output into a piezo.
- The LED socket sits between the 9 V rail and R1. A four-way DIP switch selects what is in the socket: 1 = a wire link, 2 = red LED, 3 = green LED, 4 = blue LED. Close one switch at a time; the authored state has the red LED selected.
- The capacitor charges from 9 V minus whatever the socket drops, between the 555's thresholds at one third and two thirds of the supply. Discharge runs through R2 alone and is the same for every LED.

## Observable behaviour

| socket | tone (simulated) |
|---|---|
| wire link | about 1.1 kHz |
| red LED | about 710 Hz |
| green LED | about 600 Hz |
| blue LED | about 320 Hz |

- The higher the LED's forward voltage, the less voltage is left to charge C1 and the longer each charge takes, so the tone falls.
- With the blue LED the charging voltage left over is barely above the upper threshold of 6 V, so the charge crawls over the last part; a white or blue LED with a slightly higher drop would stop the oscillator altogether.
- The LED in the socket glows faintly: its current is the charging current through R1.
- The 555's control pin sits at two thirds of the supply.

```assert
# the 555's internal divider: control pin at 2/3 of 9 V
net u1.control V 6.00 +-0.02
net vcc1.vcc V 9.00 +-0.01
```

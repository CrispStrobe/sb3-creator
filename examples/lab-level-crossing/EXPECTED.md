# lab-level-crossing — expected behaviour

## Circuit
- 5 V supply. Two reed switches stand for track contacts: contact A before the crossing, contact B after it. A magnet under the train closes them.
- Two NAND gates of a 74HC00 form a set/reset latch. Contact A pulls the /SET input low against 10 kΩ; contact B pulls /RESET low against 10 kΩ. A 10 µF capacitor on /RESET holds it low for a moment at switch-on, so the latch always starts in the "no train" state.
- The latch output Q drives the reset pin of a 555 astable (R1 = 10 kΩ, R2 = 47 kΩ, C2 = 10 µF). Lamp left hangs from the 555 output to ground; lamp right hangs from Q into the 555 output. So the lamps alternate while Q is high, and both stay dark while Q is low.

## Observable behaviour
- At switch-on: Q low, 555 held in reset, both lamps dark.
- A train passes contact A (magnet on, then off again): the latch sets, Q goes high, and the lamps start to alternate, a little over one full cycle per second.
- Passing contact A again changes nothing: the latch is already set.
- Contact B resets the latch, the 555 stops and both lamps go dark.
- The flash rate follows the 555 formula: 1.44 / ((10000 + 2 x 47000) x 0.00001) = 1.38 Hz.

```assert
# switch-on: latch reset, flasher held off
net u1.1y V 0.00 +-0.05
net u1.2y V 5.00 +-0.05
net u2.output V 0.00 +-0.05
net r_s.b V 5.00 +-0.01
buzzer_tone_hz: 1.38 +- 2%
```

The `buzzer_tone_hz` line is the 555 astable rate read from its R1, R2 and C (it is a flash rate here, not a tone).

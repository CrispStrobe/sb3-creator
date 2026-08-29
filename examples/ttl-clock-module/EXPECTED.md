# Expected behavior: ttl-clock-module

The 555 astable oscillates. The green LED blinks at a rate controlled by the
potentiometer. The simulation engine solves the RC timing and the 555's
internal comparator thresholds.

The manual step button clocks a D flip-flop wired as a divide-by-two, and the
red LED on its Q output shows the register's state. That is what "one press,
one operation" means on this bench: the press is an edge, the flip-flop is the
thing the edge moves, and the state SURVIVES the release — which is the whole
reason a clock module exists.

Measured through the engine (press = `setControl(btn1, 1)`, 20 ms per phase):

| | step node (btn1.b / ff1.clk) | ff1.q | red LED |
| --- | --- | --- | --- |
| at rest | 0 V | 0 V | off |
| press 1 | 5 V | 4.4643 V | on |
| release 1 | 0 V | 4.4643 V | **still on** |
| press 2 | 5 V | 0 V | off |
| release 2 | 0 V | 0 V | off |

The Q level follows from the model's own numbers: the output drives 5 V behind
R_OUT = 50 Ω into 220 Ω and a red LED, and the solve settles at 10.714 mA, so
the drop across R_OUT is 0.5357 V and Q sits at 4.4643 V. LED brightness is
reported as current over the 20 mA reference, hence 0.5357.

Before this revision the step button's net carried `btn1.b` and `r3.a` and
nothing else, with `r3` going to ground: pressing it moved a node that no part
read (defect D27).

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# At rest the step node is held at ground through r3 (10 k), and the register
# powers up cleared, so its Q output is at 0 V.
net ff1.clk V 0.00 +-0.01
net ff1.q V 0.00 +-0.01
```

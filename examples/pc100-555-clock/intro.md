# The clock — a machine needs a heartbeat

A 555 wired as an astable, running at about 1 Hz, with an LED so you can see it. Everything after this rung moves only when this pin changes. Slow it down or speed it up by changing the capacitor: f = 1.44 / ((R1 + 2·R2)·C). Watching a computer at one step per second is the whole reason to build one out of chips.

**Teaches:** 555 astable, RC timing, why a computer needs a clock

## What to do

Set the DIP switches and watch the outputs. Everything sits on one breadboard.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| setting | effect |
|---|---|
| ~1 Hz | LED blinks |
| bigger C | slower |
| smaller C | faster |

## What to buy

| qty | part |
|---|---|
| 1 | 555 Timer |
| 1 | Capacitor 10nF |
| 1 | Capacitor 10uF |
| 1 | LED 2V, yellow |
| 1 | Resistor 330Ω |
| 1 | Resistor 6.8kΩ |
| 1 | Resistor 68kΩ |

1 integrated circuit(s), 1 breadboard(s), 5 V.

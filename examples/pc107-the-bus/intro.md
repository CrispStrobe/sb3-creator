# The bus — one set of wires, many talkers

Two sources, one four-bit bus. Enable A and the bus shows A; enable B and it shows B; enable neither and the pull-downs bring it to zero. What makes this work is the tri-state buffer inside the 74HC244: its outputs can be HIGH, LOW, or LET GO of the wire entirely, which is a third thing a plain gate cannot do. Now enable BOTH at once. One chip pulls a line up while the other pulls it down, the voltage lands in the middle where it is neither a 1 nor a 0, and both chips heat up. That is bus contention, and preventing it is precisely why a control unit exists: of all the things that could drive the bus, it guarantees exactly one does.

**Teaches:** tri-state outputs, bus contention, why a control unit exists

## What to do

Set the DIP switches and watch the outputs. The build needs 3 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| enabled | bus |
|---|---|
| neither | 0000 |
| A only | shows A |
| B only | shows B |
| both | neither 1 nor 0 — contention |

## What to buy

| qty | part |
|---|---|
| 1 | 74HC04 Hex NOT |
| 2 | 74HC244 Octal Tri-State Buffer |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, yellow |
| 4 | Resistor 100kΩ |
| 10 | Resistor 10kΩ |
| 4 | Resistor 330Ω |

3 integrated circuit(s), 3 breadboard(s), 5 V.

# The machine reads its own memory

Nothing here is touched by hand except the clock. The program counter puts an address on the bus, the address register latches it, the RAM answers with what is stored there, and the green LEDs show the answer — then the next tick does it again, one address further along. Load memory first: set the data switches, pulse WRITE, clock on, repeat. Then just clock, and watch the machine walk through what you wrote. The timing is the lesson. States advance on the RISING clock edge and registers latch on the FALLING one, through an inverter, so the bus has settled and the right driver is enabled before anything is captured. Latch on the same edge that changes the state and you capture the bus mid-transition. The inverter bank on the RAM outputs is there because the 74LS189 gives its data back inverted.

**Teaches:** clock phases, latching on the falling edge, address vs data paths

## What to do

Set the DIP switches and watch the outputs. The build needs 4 breadboards — real logic runs out of holes quickly.

Every chip gets +5 V and GND — an IC with no power does nothing, and a floating input does something worse: it reads whatever the room is doing. That is what the 10 kΩ pull-downs prevent.

## What you should see

| action | data LEDs |
|---|---|
| write 3,9,5,12 | into cells 0-3 |
| then clock | cell 0 shows 3 |
| clock | 9 |
| clock | 5 |
| clock | 12 |

## What to buy

| qty | part |
|---|---|
| 1 | 74HC04 Hex NOT |
| 1 | 74HC08 Quad AND |
| 1 | 74HC244 Octal Tri-State Buffer |
| 1 | 74LS161 4-bit Counter |
| 1 | 74LS173 4-bit Register |
| 1 | 74LS189 16x4 RAM |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 4 | LED 2V, red |
| 4 | LED 2V, yellow |
| 4 | Resistor 100kΩ |
| 6 | Resistor 10kΩ |
| 12 | Resistor 330Ω |

6 integrated circuit(s), 4 breadboard(s), 5 V.

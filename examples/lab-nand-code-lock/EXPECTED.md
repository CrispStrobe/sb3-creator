# lab-nand-code-lock — expected behaviour

## Circuit
- Four code switches S1–S4 (one DIP block) connect 5 V to four logic inputs; a 10 kΩ pull-down holds each input at 0 V while its switch is open.
- Two 74HC00 chips (seven of the eight NAND gates in use) decode exactly one pattern: OPEN = S1 · /S2 · S3 · S4, the code 1-0-1-1. S2 passes through a NAND wired as an inverter because the code wants it OFF.
- The decoder output drives NPN Q1 through 4.7 kΩ; Q1 pulls the relay coil K1 to ground and D1 absorbs the coil's switch-off spike.
- The relay's changeover contact feeds the green OPEN LED (normally-open side) or the red LOCKED LED (normally-closed side), each through 330 Ω.

## Observable behaviour

| S1 | S2 | S3 | S4 | relay | OPEN (green) | LOCKED (red) |
|---|---|---|---|---|---|---|
| off | off | off | off | released | off | ON |
| ON | off | ON | ON | pulled in | ON | off |
| any other pattern | | | | released | off | ON |

Stepping the DIP block through all 16 patterns in the simulator opens the lock for exactly one of them (S1, S3, S4 on; S2 off). The authored state has every switch open, so the decoder output, Q1's base and the relay are all idle and the red LED is lit.

## What this verifies
1. Inverting the inputs that must be 0, then AND-ing everything, decodes one pattern out of 16.
2. A NAND with both inputs tied is an inverter; two NANDs in a row are an AND.
3. The relay isolates the "door" circuit from the logic: the logic only ever drives a transistor.

```assert
# all switches open: decoder output low, relay coil carries no current
net u2.3y V 0.00 +-0.05
net q1.base V 0.00 +-0.05
net q1.collector V 5.00 +-0.05
net u1.1y V 5.00 +-0.05
```

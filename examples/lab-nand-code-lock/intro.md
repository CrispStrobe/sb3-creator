# NAND combination lock with a relay

Four switches, two 74HC00 chips and a relay: the lock opens for one switch pattern only. The decoder is nothing but NAND gates. Where the code wants a switch OFF, that input first goes through a NAND used as an inverter, and the rest of the gates AND everything together.

**Teaches:** decoding a bit pattern, NAND as inverter and AND, driving a relay from logic

## What to do

Click **Sim**. The red LOCKED LED is on. Flip the four DIP switches and try to find the pattern that pulls in the relay and lights the green OPEN LED. There are 16 patterns, so a patient guesser finds it quickly. A real lock would need many more switches.

## What you should see

| S1 | S2 | S3 | S4 | OPEN | LOCKED |
|---|---|---|---|---|---|
| off | off | off | off | off | ON |
| ON | off | ON | ON | ON | off |
| anything else | | | | off | ON |

## Why it works

Gate 1 of U1 turns S2 around. Gate 2 combines S1 with that inverted S2, gate 3 combines S3 and S4, and two more NANDs turn those results back into "true when both are true". The last NAND in U2 says OPEN only when both halves agree. To change the code, change which inputs go through an inverter.

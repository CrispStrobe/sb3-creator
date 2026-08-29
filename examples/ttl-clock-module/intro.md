---
level: intermediate
age: 12+
prereqs: [51-555-astable]
teaches: [555-astable, clock-generation, manual-stepping, rc-timing]
---
## What you see
The clock module from a Ben Eater–style 8-bit TTL computer: a 555 timer in astable mode generating a square wave, with a potentiometer to control the speed, a green LED showing each clock pulse, and a manual step button that single-steps a register — a D flip-flop whose red LED shows the state the step left behind.

## Try this
1. Power on — the LED blinks at a rate set by the pot.
2. Turn the pot to change the clock speed: fully clockwise is fast (hundreds of Hz), fully counter-clockwise is slow (visible blinks).
3. Press the step button and watch the RED LED: it toggles on the first press and stays on when you let go. Press again and it goes out. That is what "one press, one operation" means — the edge advances a register, and the register remembers.

## What is going on
The 555 timer charges capacitor C1 through R1 and the pot, then discharges it through the pot alone. The charge/discharge cycle produces a square wave on the output pin. The pot controls how long each cycle takes — more resistance = slower clock. The 100 nF bypass cap on the control pin keeps the internal voltage reference stable.

The green LED on the output shows every clock edge. In the full TTL computer, this output drives the clock input of every register and counter — one pulse, one operation.

The step button has its own node: VCC through the button, 10 kOhm to ground. Released, that node sits at 0 V; pressed, it goes to 5 V. On its own that is just a switch, which is exactly what this bench used to be — a node no part read. It now clocks a D flip-flop wired with D fed back from /Q, so every rising edge flips it. The red LED on Q is the register's state, and the state SURVIVES the release. That difference — a lamp follows the button, a register follows the edge — is the whole reason a clock module exists.

Measured: Q sits at 4.4643 V when set, because the flip-flop drives 5 V behind 50 Ohm of output resistance into 220 Ohm and a red LED, and the solve settles at 10.714 mA.

**Why a real 555?** Other logic simulators (e.g. ngdrascal/8bitsim, MIT) had to fake the 555 with a digital clock source because their engines cannot solve the RC timing circuit. Our engine simulates the real 555 — the capacitor charges through the resistors, the internal comparators trip at 1/3 and 2/3 VCC, and the discharge transistor resets the cycle. The pot genuinely changes the frequency because it changes the RC time constant.

## Why it matters
Every digital computer needs a clock. Understanding how an RC circuit sets the frequency — and being able to slow it down to one step at a time — is the first skill in building a CPU from gates. This module is episode 1 of the 8-bit TTL computer series.

## Go further
- Try different capacitor values (10 µF = very slow, 100 nF = very fast) and observe the frequency change.
- [eater6502-bench](../eater6502-bench) — a complete 6502 computer that uses a clock like this.
- Next episode: the register module (74LS173 + 74LS245 bus transceiver).

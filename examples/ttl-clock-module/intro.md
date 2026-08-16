---
level: intermediate
age: 12+
prereqs: [51-555-astable]
teaches: [555-astable, clock-generation, manual-stepping, rc-timing]
---
## What you see
The clock module from a Ben Eater–style 8-bit TTL computer: a 555 timer in astable mode generating a square wave, with a potentiometer to control the speed, a green LED showing each clock pulse, and a manual step button for single-stepping.

## Try this
1. Power on — the LED blinks at a rate set by the pot.
2. Turn the pot to change the clock speed: fully clockwise is fast (hundreds of Hz), fully counter-clockwise is slow (visible blinks).
3. The manual step button gives you one pulse per press — essential for debugging the CPU one cycle at a time.

## What is going on
The 555 timer charges capacitor C1 through R1 and the pot, then discharges it through the pot alone. The charge/discharge cycle produces a square wave on the output pin. The pot controls how long each cycle takes — more resistance = slower clock. The 100 nF bypass cap on the control pin keeps the internal voltage reference stable.

The LED on the output shows every clock edge. In the full TTL computer, this output drives the clock input of every register and counter — one pulse, one operation. The manual button bypasses the 555 to inject a single pulse, which is how Ben Eater single-steps through instructions to debug wiring.

**Why a real 555?** Other logic simulators (e.g. ngdrascal/8bitsim, MIT) had to fake the 555 with a digital clock source because their engines cannot solve the RC timing circuit. Our engine simulates the real 555 — the capacitor charges through the resistors, the internal comparators trip at 1/3 and 2/3 VCC, and the discharge transistor resets the cycle. The pot genuinely changes the frequency because it changes the RC time constant.

## Why it matters
Every digital computer needs a clock. Understanding how an RC circuit sets the frequency — and being able to slow it down to one step at a time — is the first skill in building a CPU from gates. This module is episode 1 of the 8-bit TTL computer series.

## Go further
- Try different capacitor values (10 µF = very slow, 100 nF = very fast) and observe the frequency change.
- [eater6502-bench](../eater6502-bench) — a complete 6502 computer that uses a clock like this.
- Next episode: the register module (74LS173 + 74LS245 bus transceiver).

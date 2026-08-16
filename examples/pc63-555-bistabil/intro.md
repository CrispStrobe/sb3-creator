---
level: intermediate
age: 12+
prereqs: [pc47-555-monostable]
teaches: [555-timer, bistable, flip-flop, set-reset]
---
## What you see
A 555 timer as a bistable flip-flop. Two buttons control the output: Set turns the LED on, Reset turns it off. The timer remembers the state — with no buttons pressed, the LED stays in its last position.

## Try this
1. Click **Sim** — the LED starts dark.
2. Press the Set button — the LED lights and stays on.
3. Press the Reset button — the LED goes dark and stays off.
4. No button pressed: the state is remembered.

## What is going on
In bistable mode the 555 uses only its trigger and threshold inputs. A brief LOW pulse on trigger (pin 2) sets the output HIGH. A HIGH pulse on threshold (pin 6) sets the output LOW. The RC timing components are not needed — the IC works as a pure RS flip-flop.

## Why it matters
A flip-flop is the simplest form of memory: one bit. This circuit demonstrates the fundamental principle behind every digital memory, from an SRAM cell to a processor register.

## Go further
- [pc47-555-monostable](../pc47-555-monostable) — the same timer as a one-shot pulse.
- [51-555-astable](../51-555-astable) — the timer as an astable blinker.
- [pc71-nand-entpreller](../pc71-nand-entpreller) — an RS latch built from NAND gates.

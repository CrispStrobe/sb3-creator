---
level: advanced
age: 14+
prereqs: [eater6502-bench]
teaches: [bus-contention, address-decode-debugging, chip-select]
---
## What you see
The same Ben Eater–style 6502 computer as **eater6502-bench** — but with a deliberate wiring error in the address decode. The Warnings panel immediately reports a **bus contention** error naming the colliding address.

## Try this
1. Open the Warnings panel. You will see a "bus contention at $2000" error — two chips both think that address is theirs.
2. Read the error message: it names which two chips collide and at what address.
3. Find the bug: compare this circuit's glue-logic wiring to the working **eater6502-bench**. One chip-select wire has been moved from its correct source to GND.
4. Fix it: reconnect VIA.CS2B to glue1.4y (the output of the NAND gate) instead of GND. The contention error should disappear.

## What is going on
The VIA's chip-select pin CS2B has been wired to ground instead of to the glue-logic output that normally gates it. With CS2B permanently low, the VIA responds whenever A13 is high (CS1=A13) — including inside the RAM's address range. At $2000 (where A13=1 and the RAM is also selected), both chips drive the data bus simultaneously. On real hardware this is a short circuit between two output drivers.

The extractor evaluates every chip's select condition at all 65536 addresses and catches exactly this: two selected at one address = contention, with the address named so you know where to look with a logic analyser.

## Why it matters
Bus contention is the most common and most destructive wiring error in bus-based computers. It is invisible to the eye (the breadboard looks fine), silent (no error message from the CPU), and damaging (chip outputs fighting can exceed safe current). Learning to read a memory map and verify non-overlapping chip selects is the skill that separates a working computer from a pile of warm chips.

## Go further
- [eater6502-bench](../eater6502-bench) — the same circuit, correctly wired.
- Try creating your OWN contention bug: disconnect ROM.CEB and wire it to ground. What does the extractor say now?

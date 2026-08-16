---
level: intermediate
age: 12+
prereqs: [pc45-nand-test]
teaches: [NAND-gate, inverter, NOT-gate, logic]
---
## What you see
A NAND gate with its inputs tied together becomes an inverter (NOT gate): switch ON → LED OFF. Switch OFF → LED ON. A single gate produces the NOT function.

## Try this
1. Click **Sim** — the LED lights (input LOW → output HIGH).
2. Toggle the switch — the LED goes dark (input HIGH → output LOW).
3. Toggle back — the LED lights again.

## What is going on
A NAND gate with both inputs on the same signal outputs LOW only when both inputs are HIGH — which is the same as NOT. This is the foundation of all NAND logic: every other gate (AND, OR, NOR, XOR) can be built from NAND gates alone.

## Go further
- [pc45-nand-test](../pc45-nand-test) — the full NAND truth table.
- [pc71-nand-entpreller](../pc71-nand-entpreller) — two NAND gates as an SR latch.

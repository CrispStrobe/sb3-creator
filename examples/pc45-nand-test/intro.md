---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor]
teaches: [nand-gate, truth-table, digital-logic]
---
## What you see
A NAND gate with two switches as inputs and an LED as the output indicator. The LED shows the result of the NAND operation: it is off only when both inputs are high.

## Try this
1. Click **Sim** with both switches open (both inputs low). The LED is on — NAND of (0,0) is 1.
2. Close one switch. The LED stays on — NAND of (0,1) or (1,0) is still 1.
3. Close both switches. The LED goes dark — NAND of (1,1) is 0. This is the only combination that turns it off.

## What is going on
A NAND gate outputs low only when all its inputs are high; otherwise it outputs high. It is the inverted AND function. The truth table has four rows, and three of them produce a high output. The pull-down resistors ensure each input is at a defined low level when its switch is open — without them, a floating input could be read as either high or low.

## Why it matters
NAND is the universal gate — any other logic function (AND, OR, NOT, XOR) can be built from NAND gates alone. Every digital circuit, from the simplest counter to the most complex processor, is ultimately built from combinations of NAND (or NOR) gates.

## Go further
- [pc46-xor-selector](../pc46-xor-selector) — the XOR gate: different logic, same switches.
- [pc28-logic-interlock](../pc28-logic-interlock) — logic gates controlling real loads.
- Experiment: build a NOT gate from a single NAND by tying both inputs together.

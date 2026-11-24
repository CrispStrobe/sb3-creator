---
level: foundation
age: 10+
prereqs: []
teaches: [cp1-cells, cp1-accumulator, seven-segment-display]
---
## A number you can follow

This original program has three cells: `AKO 42` loads a constant, `ANZ` asks the CP1 firmware to display the accumulator, and `HLT` stops the teaching program. The actual 8049 keeps servicing the monitor and display. Import your own compatible 2 KB CP1 monitor ROM before running; this example does not contain a ROM.

## Try this

1. Inspect the source and its decimal listing: `04.042`, `02.000`, `01.000`. Each cell stores an opcode byte and an operand byte. The dot is a separator, not a decimal fraction.
2. Load the program into RAM. Use the CP1 monitor's PC key to select cell 0 and RUN to start the teaching program. The host's Run control advances the 8049; it does not replace the monitor's RUN key.
3. Read the six segment displays after the firmware has scanned them. Compare the visible value with 42. If a segment pattern cannot be read as a digit, record the actual pattern instead of guessing a number.
4. Change `VALUE` to 73, load again, select cell 0, and repeat. Compare the RAM cells before and after the change.

## Two different steps

The panel's CPU step advances one real 8049 instruction. The CP1 keypad's STEP key requests one teaching-language operation through the ROM. One teaching operation can take many CPU instructions. Use manual lesson completion after you have made the comparison; opening a panel alone does not prove the displayed result.

---
level: foundation
age: 10+
prereqs: []
teaches: [cp1-cells, cp1-accumulator, seven-segment-display]
---
## A number you can follow

This original program has three cells: `AKO 42` loads a constant, `ANZ` asks the CP1 firmware to display the accumulator, and `SPU display` returns to the display command. Repeating the display command keeps the result visible. In Debugger or Widgets, choose **Use Brickwright monitor**. You can also import a compatible 2 KB monitor ROM.

## Try this

1. Inspect the source and its decimal listing: `04.042`, `02.000`, `09.001`. Each cell stores an opcode byte and an operand byte. The dot is a separator, not a decimal fraction.
2. After choosing the monitor, use Run CPU until the monitor reaches its stable ready display. Pause CPU, load the cells, then resume with Run CPU without resetting. On the CP1 keypad, use PC to select cell 0 and RUN to start the teaching program.
3. Read the six segment displays after the firmware has scanned them. Compare the visible value with 42. If a segment pattern cannot be read as a digit, record the actual pattern instead of guessing a number.
4. Stop the loop with keypad STP and pause the CPU. Change `VALUE` to 73, load again, resume the CPU without resetting, then select cell 0 with keypad PC and press RUN. Compare the RAM cells before and after the change.

## Why repeat the display?

The tested 2716 monitor ROM changes the display to its program-position message when HLT follows ANZ immediately; it shows `P003` instead of retaining 42. The loop gives the accumulator display a stable observation point. As an experiment, replace the third cell with HLT, compare the monitor message, and restore the loop afterward.

## Two different steps

The panel's CPU step advances one real 8049 instruction. The CP1 keypad's STEP key requests one teaching-language operation through the ROM. One teaching operation can take many CPU instructions. Use manual lesson completion after you have made the comparison; opening a panel alone does not prove the displayed result.

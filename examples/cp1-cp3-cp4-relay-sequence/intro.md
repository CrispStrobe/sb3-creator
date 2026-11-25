---
level: intermediate
age: 11+
prereqs: [cp1-expansion-step, cp1-cp4-relay-signals]
teaches: [cp1-memory, cp1-output, relay, isolated-load]
---

## Play a sequence from expansion RAM

The CP3 expansion adds teaching cells 128–255 and Port 4. In this circuit, P4.0 and P4.1 connect to the two CP4-style relay drivers. Each relay closes a contact in the independent lamp circuit. Both the port wires and the lamp supply are visible in **Circuits**.

1. Choose **Use Brickwright monitor**, run the CPU to the ready display, then pause and load the supplied source. Resume without resetting. Enter **0, 0, 0, PC, RUN** on the keypad.
2. The display cycles through 1, 2 and 0. The green lamp, red lamp, and dark phase follow the two low bits of those values. In **Code**, find `LDA entry` and `LDA exit`. The two `P4A 0` instructions that follow write a whole byte to Port 4.
3. In **Debugger**, stop at the second `P4A 0` and check that the accumulator holds 2. Step that instruction. Follow the wire from P4.1 to the red lamp's relay driver, then trace the lamp's separate battery loop.
4. Pause and edit cell 255 from `00.002` to `00.003`. Resume the program. Both lamps now light in the second phase because both low bits are set. Cell 128 still controls the first phase. To keep the change in the source, change `exit: DATA 2` to `exit: DATA 3` in **Code** and load the source again.

## KIM-1: switches to lights

Press **GO** on the KIM-1 in Controller. Toggle **PB0**, **PB1**, **PB2** or **PB3** under Switches. The corresponding **PA0–PA3** LED follows the switch through a program running on the NMOS 6502.

The program makes port A an output, reads port B, and writes that value to port A. These are real circuit connections, including the resistors and LEDs. The teaching clock runs at 1000 Hz so the workbench remains easy to observe.

Press **ST** to stop the CPU. Select **SST**, then press **GO** to execute one instruction at a time. **AD** selects an address, **DA** changes its byte, **+** advances, and **PC** returns to the stopped program counter. **RS** resets controls and keeps RAM.

Use **Code → KIM-1** to load your own addressed hexadecimal bytes. Programs and keypad edits are saved with the circuit. For the hardware monitor, select **Use Brickwright ROM** under **Debugger → Firmware and TTY**. **Expansion and storage** opens the slot and media controls.

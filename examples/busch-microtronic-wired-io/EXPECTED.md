# Expected behavior

The circuit opens with the Microtronic stopped. Press **Run** in its instrument
panel to execute the program stored in the computer part:

```text
00: FD0   Read the four input terminals into register R0.
01: FE0   Copy R0 to the four latched output terminals.
02: C00   Return to the input instruction.
```

Toggle **IN1**, **IN2** or **IN3** under Switches. After the next input and output
instructions, the corresponding **OUT1**, **OUT2** or **OUT3** LED follows that
switch. Open switches read low through their pull-down resistors; closed
switches connect the computer's supply terminal to the input.

**OUT4** blinks while the program runs because the circuit explicitly connects
the independent **CLOCK** terminal to **IN4**. The computer does not make that
connection internally. Each output LED has its own series resistor and a
return connection to the computer's ground terminal.

Press **Halt** to stop execution and hold the last output value. The independent
clock continues. **Step** executes one instruction, so an input change reaches
the LEDs only after the input instruction and then the output instruction.
**Reset** stops execution, clears the working state and output latch, and keeps
the authored program available for another run.

This example exercises the documented learner instruction model and its actual
circuit terminals. It does not load the original TMS1600 firmware. The program
is stored in the circuit file's `params.program`, so saving and reloading the
circuit retains the program.
